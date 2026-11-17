import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import { ROUTE_SEO_ENTRIES, resolveRouteSeo } from './src/shared/seoMeta';
import { COURSES, CourseItem, getCourseByCodeOrSlug } from './src/data/coursesData';
import { getInstitutionalServiceBySlug } from './src/data/institutionalServicesData';
import {
  AVATARS_DIR,
  SUBMISSIONS_DIR,
  createNotification,
  db,
  syncCatalogAndSeedUsers,
} from './server/db';
import { AuthedRequest, attachAuth, requireAuth } from './server/auth';
import { createAuthRouter } from './server/routes/authRoutes';
import { createDashboardRouter } from './server/routes/dashboardRoutes';
import { createAdminRouter } from './server/routes/adminRoutes';

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

const MANUAL_PAYMENT_NUMBER = '+8801601289683';

function normalizeBdtDigits(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

// Simple in-memory IP rate limiter (15-minute sliding window)
const rateBuckets = new Map<string, number[]>();

function isRateLimited(ip: string, limit = 25, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const timestamps = (rateBuckets.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    rateBuckets.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  rateBuckets.set(ip, timestamps);
  return false;
}

function getBaseUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function escapeHtmlAttr(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function injectRouteSeoHtml(
  html: string,
  reqPath: string,
  baseUrl: string
): { html: string; isKnown: boolean } {
  const { entry, isKnown } = resolveRouteSeo(reqPath);
  const targetPath = entry.canonicalPath || entry.path;
  const canonical = `${baseUrl}${targetPath === '/' ? '/' : targetPath}`;
  const safeTitle = escapeHtmlAttr(entry.title);
  const safeDesc = escapeHtmlAttr(entry.description);
  const safeUrl = escapeHtmlAttr(canonical);
  const ogType = entry.ogType || 'website';

  let out = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${safeDesc}" />`
    )
    .replace(
      /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:type" content="${ogType}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${safeTitle}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${safeDesc}" />`
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${safeTitle}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${safeDesc}" />`
    );

  const extraHeadTags = [
    `<link rel="canonical" href="${safeUrl}" />`,
    `<meta property="og:url" content="${safeUrl}" />`,
    entry.noindex ? `<meta name="robots" content="noindex, nofollow" />` : '',
    entry.jsonLd
      ? `<script type="application/ld+json" data-atlas-jsonld="true">${JSON.stringify(entry.jsonLd)}</script>`
      : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  out = out.replace('</head>', `    ${extraHeadTags}\n  </head>`);
  return { html: out, isKnown };
}

async function startServer() {
  // Ensure SQLite catalog & initial admin/instructor accounts are synced on startup
  syncCatalogAndSeedUsers();

  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '8mb' }));
  app.use(attachAuth);

  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'atlas-ai-education', database: 'sqlite' });
  });

  // Mount Auth, Learner Dashboard, and Admin Console routers
  app.use('/api/auth', createAuthRouter());
  app.use('/api/dashboard', createDashboardRouter());
  app.use('/api/admin', createAdminRouter());

  // Public course seat capacity & availability (never fabricates remaining counts)
  app.get('/api/courses/availability', (_req: Request, res: Response) => {
    const rows = db
      .prepare(`
        SELECT c.code, c.max_seats,
               (SELECT COUNT(*) FROM enrolments e WHERE e.course_code = c.code AND e.status = 'Confirmed') as confirmed_count
        FROM courses c
      `)
      .all() as Array<{ code: string; max_seats: number | null; confirmed_count: number }>;

    const availability: Record<
      string,
      { maxSeats: number | null; confirmedCount: number; isFull: boolean }
    > = {};

    for (const r of rows) {
      availability[r.code] = {
        maxSeats: r.max_seats,
        confirmedCount: r.confirmed_count,
        isFull: r.max_seats !== null && r.confirmed_count >= r.max_seats,
      };
    }

    res.json({ availability });
  });

  // Public Certificate Verification endpoint (exposes only minimal verification metadata)
  app.get('/api/certificates/verify/:code', (req: Request, res: Response) => {
    const certCode = req.params.code.trim().toUpperCase();
    const row = db
      .prepare(`
        SELECT cert.certificate_code, cert.holder_name, cert.course_code,
               c.title as course_title, cert.certificate_title, cert.category_name,
               cert.status, cert.issued_at
        FROM certificates cert
        JOIN courses c ON c.code = cert.course_code
        WHERE UPPER(cert.certificate_code) = ?
      `)
      .get(certCode) as
      | {
          certificate_code: string;
          holder_name: string;
          course_code: string;
          course_title: string;
          certificate_title: string;
          category_name: string;
          status: string;
          issued_at: string;
        }
      | undefined;

    if (!row) {
      res.status(404).json({
        valid: false,
        error: 'No certificate matching this ID was found in Atlas AI Education records.',
      });
      return;
    }

    res.json({
      valid: row.status === 'Issued',
      certificate: {
        certificateCode: row.certificate_code,
        holderName: row.holder_name,
        courseCode: row.course_code,
        courseTitle: row.course_title,
        certificateTitle: row.certificate_title,
        categoryName: row.category_name,
        status: row.status,
        issuedAt: row.issued_at,
        issuer: 'Atlas AI Education (Atlas AI Institute)',
        disclosure:
          'Non-accredited educational completion or participation certificate issued by Atlas AI Education.',
      },
    });
  });

  // Serve uploaded avatars safely
  app.get('/api/files/avatars/:filename', (req: Request, res: Response) => {
    const safeName = path.basename(req.params.filename);
    const fullPath = path.join(AVATARS_DIR, safeName);
    if (!fs.existsSync(fullPath)) {
      res.status(404).end();
      return;
    }
    res.sendFile(fullPath);
  });

  // Protected submission file download (strictly owner, instructor, or admin)
  app.get('/api/files/submissions/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const sub = db
      .prepare('SELECT id, user_id, file_path, file_name FROM submissions WHERE id = ?')
      .get(req.params.id) as
      | { id: string; user_id: string; file_path: string; file_name: string }
      | undefined;

    if (!sub || !sub.file_path) {
      res.status(404).json({ error: 'Submission file not found.' });
      return;
    }

    const isPrivileged = req.authUser!.role === 'admin' || req.authUser!.role === 'instructor';
    if (sub.user_id !== req.authUser!.id && !isPrivileged) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const fullPath = path.join(SUBMISSIONS_DIR, path.basename(sub.file_path));
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'Stored file missing on disk.' });
      return;
    }

    res.download(fullPath, sub.file_name || path.basename(fullPath));
  });

  // Robots.txt
  app.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`
    );
  });

  // Dynamic Sitemap.xml
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);
    const urls = ROUTE_SEO_ENTRIES.filter((entry) => !entry.excludeFromSitemap)
      .map((entry) => {
        const loc = `${baseUrl}${entry.path === '/' ? '/' : entry.path}`;
        const priority =
          entry.path === '/' ? '1.0' : entry.path.startsWith('/programmes/') ? '0.85' : '0.8';
        return `  <url>\n    <loc>${escapeHtmlAttr(loc)}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
    res.type('application/xml').send(xml);
  });

  // Programme Application / Enrolment Intake API (persisted in SQLite with atomic seat capacity enforcement)
  app.post('/api/applications', (req: AuthedRequest, res: Response) => {
    const clientIp = req.ip || 'unknown';
    if (isRateLimited(clientIp, 30)) {
      res.status(429).json({
        error: 'এই network থেকে অনেকবার আবেদন পাঠানো হয়েছে। একটু অপেক্ষা করে আবার চেষ্টা করুন।',
      });
      return;
    }

    const body = req.body || {};

    // Honeypot & timing spam protection
    if (typeof body.website_url === 'string' && body.website_url.trim().length > 0) {
      res.status(400).json({
        error: 'Automated spam validation-এর কারণে আবেদনটি বাতিল করা হয়েছে।',
      });
      return;
    }
    if (typeof body.submittedAfterMs === 'number' && body.submittedAfterMs < 800) {
      res.status(400).json({
        error: 'Submit করার আগে আবেদনের তথ্যগুলো আরেকবার যাচাই করে নিন।',
      });
      return;
    }

    // Explicitly reject payment-card style fields
    if ('cardNumber' in body || 'cvv' in body || 'paymentToken' in body) {
      res.status(400).json({
        error: 'এই application form-এ কখনো credit/debit card-এর তথ্য দেবেন না।',
      });
      return;
    }

    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const country =
      typeof body.country === 'string' && body.country.trim().length > 0
        ? body.country.trim()
        : 'Bangladesh';
    const educationalBackground =
      typeof body.educationalBackground === 'string' ? body.educationalBackground.trim() : '';
    const selectedProgrammeRaw =
      typeof body.selectedProgramme === 'string' ? body.selectedProgramme.trim() : '';
    const approvedCourse = selectedProgrammeRaw
      ? getCourseByCodeOrSlug(selectedProgrammeRaw)
      : undefined;
    const motivation = typeof body.motivation === 'string' ? body.motivation.trim() : '';
    const mode = typeof body.mode === 'string' ? body.mode.trim() : 'course-application';
    const ageBracket = body.ageBracket === 'minor' ? 'minor' : 'adult';
    const guardianConsent = body.guardianConsent === true;
    const privacyConsent = body.privacyConsent === true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!approvedCourse) {
      res.status(400).json({
        error: 'নির্বাচিত প্রোগ্রামটি বৈধ নয়। দয়া করে অনুমোদিত তালিকা থেকে প্রোগ্রাম নির্বাচন করুন।',
      });
      return;
    }

    const isFreeProgramme = approvedCourse.isFree;

    if (mode === 'free-masterclass' && !isFreeProgramme) {
      res.status(400).json({
        error: 'Free Masterclass ফর্মের মাধ্যমে কেবল বিনামূল্যের প্রোগ্রামে নিবন্ধন করা যাবে।',
      });
      return;
    }

    if (
      fullName.length < 2 ||
      fullName.length > 120 ||
      !emailRegex.test(email) ||
      phone.length < 6 ||
      phone.length > 40 ||
      country.length < 2 ||
      (!isFreeProgramme && educationalBackground.length < 2) ||
      motivation.length > 3000 ||
      !privacyConsent
    ) {
      res.status(400).json({
        error:
          'দয়া করে সব প্রয়োজনীয় ঘর সঠিকভাবে পূরণ করুন এবং Privacy Policy ও শর্তাবলিতে সম্মতি দিন।',
      });
      return;
    }

    if (approvedCourse.code === 'SP-WSAI' && ageBracket === 'minor' && !guardianConsent) {
      res.status(400).json({
        error: '১৮ বছরের কম বয়সীদের ক্ষেত্রে অভিভাবকের সম্মতি নিশ্চিত করা আবশ্যক।',
      });
      return;
    }

    const paymentMethodRaw =
      typeof body.paymentMethod === 'string' ? body.paymentMethod.trim().toLowerCase() : '';
    const transactionId =
      typeof body.transactionId === 'string' ? body.transactionId.trim().toUpperCase() : '';
    const senderNumber =
      typeof body.senderNumber === 'string' ? body.senderNumber.trim() : phone;

    if (!isFreeProgramme) {
      const authoritativeAmount = approvedCourse.fee;
      if (typeof body.amount === 'string' && body.amount.trim().length > 0) {
        const submittedDigits = normalizeBdtDigits(body.amount);
        const expectedDigits = normalizeBdtDigits(authoritativeAmount);
        if (!submittedDigits || submittedDigits !== expectedDigits) {
          res.status(400).json({
            error: `প্রদত্ত ফি-র পরিমাণ সঠিক নয়। ${approvedCourse.title} (${approvedCourse.code})-এর নির্ধারিত ফি ${authoritativeAmount}।`,
          });
          return;
        }
      }

      if (
        (paymentMethodRaw !== 'bkash' && paymentMethodRaw !== 'nagad') ||
        transactionId.length < 4 ||
        transactionId.length > 60
      ) {
        res.status(400).json({
          error:
            'Paid programme-এর জন্য bKash অথবা Nagad Send Money-র সঠিক Transaction ID (TrxID) প্রদান করুন।',
        });
        return;
      }
    }

    const prefix = approvedCourse.code === 'SP-WSAI' ? 'WSAI' : 'AAE';
    const referenceId = `${prefix}-${new Date().getUTCFullYear()}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;
    const enrolmentId = `enr_${crypto.randomBytes(6).toString('hex')}`;
    const paymentId = `pay_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();
    const linkedUserId = req.authUser ? req.authUser.id : null;

    // Atomic transaction for seat capacity check and enrolment/payment creation
    db.exec('BEGIN IMMEDIATE');
    try {
      const courseDb = db
        .prepare('SELECT code, max_seats, fee_bdt, fee_display FROM courses WHERE code = ?')
        .get(approvedCourse.code) as {
        code: string;
        max_seats: number | null;
        fee_bdt: number;
        fee_display: string;
      };

      if (courseDb && courseDb.max_seats !== null) {
        const confirmed = db
          .prepare("SELECT COUNT(*) as c FROM enrolments WHERE course_code = ? AND status = 'Confirmed'")
          .get(approvedCourse.code) as { c: number };

        if (confirmed.c >= courseDb.max_seats) {
          db.exec('ROLLBACK');
          res.status(409).json({
            error: `${approvedCourse.title} (${approvedCourse.code}) কোর্সের নির্ধারিত ${courseDb.max_seats}টি আসন পূর্ণ হয়ে গেছে (Course Full)।`,
          });
          return;
        }
      }

      if (linkedUserId) {
        const existingActive = db
          .prepare(`
            SELECT id, status FROM enrolments
            WHERE user_id = ? AND course_code = ? AND status IN ('Pending', 'Confirmed')
          `)
          .get(linkedUserId, approvedCourse.code) as { id: string; status: string } | undefined;

        if (existingActive) {
          db.exec('ROLLBACK');
          res.status(409).json({
            error:
              existingActive.status === 'Confirmed'
                ? 'আপনি ইতোমধ্যেই এই কোর্সে নিবন্ধিত (Confirmed) আছেন। আপনার Learner Dashboard দেখুন।'
                : 'এই কোর্সের জন্য আপনার একটি আবেদন ইতোমধ্যেই যাচাইয়ের জন্য Pending অবস্থায় আছে।',
          });
          return;
        }
      }

      const enrolmentStatus = isFreeProgramme ? 'Confirmed' : 'Pending';
      const paymentStatus = isFreeProgramme ? 'Paid' : 'Pending';
      const paymentMethod = isFreeProgramme ? 'free' : (paymentMethodRaw as 'bkash' | 'nagad');

      db.prepare(`
        INSERT INTO enrolments (
          id, reference_id, user_id, applicant_name, applicant_email, applicant_phone,
          country, educational_background, motivation, course_code, mode, status,
          enrolled_at, confirmed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        enrolmentId,
        referenceId,
        linkedUserId,
        fullName,
        email,
        phone,
        country,
        educationalBackground,
        motivation,
        approvedCourse.code,
        mode,
        enrolmentStatus,
        now,
        isFreeProgramme ? now : null,
        now
      );

      db.prepare(`
        INSERT INTO payments (
          id, reference_id, enrolment_id, user_id, course_code, amount_display, amount_bdt,
          payment_method, payment_number, sender_phone, transaction_id, status, verified_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentId,
        referenceId,
        enrolmentId,
        linkedUserId,
        approvedCourse.code,
        isFreeProgramme ? 'Free Enrolment' : courseDb.fee_display,
        isFreeProgramme ? 0 : courseDb.fee_bdt,
        paymentMethod,
        isFreeProgramme ? '' : MANUAL_PAYMENT_NUMBER,
        isFreeProgramme ? '' : senderNumber,
        isFreeProgramme ? '' : transactionId,
        paymentStatus,
        isFreeProgramme ? now : null,
        now
      );

      if (linkedUserId) {
        createNotification({
          userId: linkedUserId,
          type: isFreeProgramme ? 'enrolment' : 'payment',
          title: isFreeProgramme
            ? `Enrolment Confirmed: ${approvedCourse.title}`
            : `Application Submitted: ${approvedCourse.title}`,
          message: isFreeProgramme
            ? `Your free enrolment (${referenceId}) is confirmed. You can open the Learning Centre now.`
            : `Your manual payment (${transactionId}, ref ${referenceId}) is pending admin verification.`,
          link: isFreeProgramme
            ? `/dashboard/learning/${approvedCourse.code}`
            : '/dashboard/payments',
        });
      }

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    if (!isFreeProgramme) {
      res.status(201).json({
        status: 'pending_verification',
        verificationStatus: 'Pending Verification',
        referenceId,
        paymentMethod: paymentMethodRaw,
        paymentNumber: MANUAL_PAYMENT_NUMBER,
        transactionId,
        amount: approvedCourse.fee,
        message:
          'আপনার আবেদন এবং bKash / Nagad Manual Payment (TrxID) তথ্য যাচাইয়ের জন্য সংরক্ষণ করা হয়েছে। পেমেন্ট যাচাই সম্পন্ন হলে আপনার Learner Dashboard-এ কোর্সটি চালু হবে।',
        disclaimer: `Verification Notice: ${MANUAL_PAYMENT_NUMBER} নম্বরে Send Money-র Transaction ID ম্যানুয়ালি যাচাই করার পর নিবন্ধন নিশ্চিত করা হবে।`,
      });
      return;
    }

    res.status(201).json({
      status: 'confirmed',
      verificationStatus: 'Confirmed',
      referenceId,
      message:
        'আপনার বিনামূল্যের নিবন্ধনটি সফলভাবে নিশ্চিত করা হয়েছে। লগইন করা থাকলে আপনার Learner Dashboard থেকেই কোর্সে প্রবেশ করতে পারবেন।',
      disclaimer:
        'Disclosure: এই বিনামূল্যের প্রোগ্রামে কোনো ফি বা পেমেন্ট প্রয়োজন নেই। Non-accredited programme।',
    });
  });

  // Institutional Contact Enquiry API
  app.post('/api/contact', (req: Request, res: Response) => {
    const clientIp = req.ip || 'unknown';
    if (isRateLimited(clientIp, 15)) {
      res.status(429).json({
        error: 'অনেকবার request পাঠানো হয়েছে। একটু পর আবার চেষ্টা করুন।',
      });
      return;
    }

    const body = req.body || {};
    if (typeof body.website_url === 'string' && body.website_url.trim().length > 0) {
      res.status(400).json({ error: 'Request বাতিল করা হয়েছে।' });
      return;
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      name.length < 2 ||
      !emailRegex.test(email) ||
      subject.length < 3 ||
      message.length < 10
    ) {
      res.status(400).json({
        error:
          'দয়া করে সঠিক নাম, Email Address, Subject এবং Message (কমপক্ষে ১০ অক্ষর) লিখুন।',
      });
      return;
    }

    const referenceId = `MSG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    db.prepare(`
      INSERT INTO contact_messages (reference_id, name, email, subject, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(referenceId, name, email, subject, message, new Date().toISOString());

    res.status(201).json({
      status: 'logged',
      referenceId,
      message: 'আপনার বার্তাটি গ্রহণ করা হয়েছে। কোনো ব্যক্তিগত তথ্য জনসমক্ষে প্রকাশ করা হয় না।',
    });
  });

  // Institutional Training & Advisory Consultation Inquiry API
  app.post('/api/institutional-inquiries', (req: Request, res: Response) => {
    const clientIp = req.ip || 'unknown';
    if (isRateLimited(clientIp, 12)) {
      res.status(429).json({
        error:
          'Too many institutional inquiry requests from this network. Please wait briefly and try again.',
      });
      return;
    }

    const body = req.body || {};

    if (typeof body.website_url === 'string' && body.website_url.trim().length > 0) {
      res.status(400).json({ error: 'Automated spam validation rejected this submission.' });
      return;
    }
    if (typeof body.submittedAfterMs === 'number' && body.submittedAfterMs < 800) {
      res.status(400).json({ error: 'Please review your inquiry details before submitting.' });
      return;
    }

    if (
      'paymentMethod' in body ||
      'transactionId' in body ||
      'cardNumber' in body ||
      'cvv' in body ||
      'amount' in body
    ) {
      res.status(400).json({
        error:
          'Institutional services use consultation scoping and never accept course checkout or payment fields.',
      });
      return;
    }

    const serviceSlugRaw =
      typeof body.serviceSlug === 'string' ? body.serviceSlug.trim() : '';
    const service = serviceSlugRaw ? getInstitutionalServiceBySlug(serviceSlugRaw) : undefined;
    if (!service) {
      res.status(400).json({
        error:
          'Selected institutional service is invalid. Please choose one of the listed institutional offerings.',
      });
      return;
    }

    const organisationName =
      typeof body.organisationName === 'string' ? body.organisationName.trim() : '';
    const organisationType =
      typeof body.organisationType === 'string' ? body.organisationType.trim() : 'company';
    const contactName =
      typeof body.contactName === 'string' ? body.contactName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const requirements =
      typeof body.requirements === 'string' ? body.requirements.trim() : '';
    const pathway = typeof body.pathway === 'string' ? body.pathway.trim() : '';
    const sector = typeof body.sector === 'string' ? body.sector.trim() : '';
    const privacyConsent = body.privacyConsent === true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      organisationName.length < 2 ||
      organisationName.length > 160 ||
      contactName.length < 2 ||
      contactName.length > 120 ||
      !emailRegex.test(email) ||
      phone.length < 6 ||
      phone.length > 40 ||
      requirements.length < 15 ||
      requirements.length > 4000 ||
      !privacyConsent
    ) {
      res.status(400).json({
        error:
          'Please provide your organisation name, contact person, valid email, phone number, requirements (15+ chars), and confirm the disclosure box.',
      });
      return;
    }

    if (service.slug === 'ai-readiness-assessment' && !pathway) {
      res.status(400).json({
        error:
          'Please select an AI Readiness Assessment pathway (Companies, Offices, or Universities).',
      });
      return;
    }

    if (service.slug === 'ai-implementation-roadmap' && !sector) {
      res.status(400).json({
        error: 'Please select a target sector for the AI Implementation Roadmap.',
      });
      return;
    }

    const referenceId = `INST-${new Date().getUTCFullYear()}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

    db.prepare(`
      INSERT INTO institutional_inquiries (
        reference_id, service_slug, service_title, organisation_name, organisation_type,
        contact_name, email, phone, pathway, sector, requirements, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      referenceId,
      service.slug,
      service.title,
      organisationName,
      organisationType,
      contactName,
      email,
      phone,
      pathway,
      sector,
      requirements,
      new Date().toISOString()
    );

    res.status(201).json({
      status: 'consultation_requested',
      referenceId,
      serviceSlug: service.slug,
      serviceTitle: service.title,
      pathway: pathway || undefined,
      sector: sector || undefined,
      message: `Your institutional consultation request for ${service.title} has been logged. Our advisory team will review your requirements and reach out to coordinate scoping.`,
    });
  });

  // Course-Based Scholarship Programme Availability API
  app.get('/api/scholarships/availability', (_req: Request, res: Response) => {
    const paidCourses = COURSES.filter((c: CourseItem) => !c.isFree);
    const approvedCounts = db
      .prepare(`
        SELECT course_code, COUNT(*) as c
        FROM scholarship_applications
        WHERE status = 'Approved'
        GROUP BY course_code
      `)
      .all() as Array<{ course_code: string; c: number }>;

    const approvedMap = new Map<string, number>();
    for (const row of approvedCounts) {
      approvedMap.set(row.course_code, row.c);
    }

    const courses = paidCourses.map((c: CourseItem) => {
      const approvedCount = approvedMap.get(c.code) || 0;
      const feeNum = parseInt(c.fee.replace(/[^\d]/g, ''), 10) || 0;
      const maxWaiverBdt = Math.round(feeNum * 0.5);
      const feeAfterWaiverBdt = feeNum - maxWaiverBdt;

      return {
        code: c.code,
        title: c.title,
        categorySlug: c.categorySlug,
        categoryName: c.categoryName,
        fee: c.fee,
        feeNum,
        maxWaiverPercent: 50,
        maxWaiverBdt,
        feeAfterWaiverBdt,
        approvedCount,
        maxScholarships: 5,
        remainingScholarships: Math.max(0, 5 - approvedCount),
        isOpen: approvedCount < 5,
      };
    });

    res.json({
      maxScholarshipsPerCourse: 5,
      maxWaiverPercent: 50,
      policy: {
        allocation: 'সর্বোচ্চ ৫ জন শিক্ষার্থী প্রতি কোর্সে',
        maxWaiver: 'Course Fee-এর সর্বোচ্চ ৫০% পর্যন্ত',
        basis: 'Merit-based এবং Need-based মানবিক ও মেধার বিবেচনা',
        freeCoursesExcluded: true,
      },
      courses,
    });
  });

  // Course-Based Scholarship Application Submission API
  app.post('/api/scholarships/apply', (req: AuthedRequest, res: Response) => {
    const clientIp = req.ip || 'unknown';
    if (isRateLimited(clientIp, 20)) {
      res.status(429).json({
        error: 'অনেকবার আবেদন পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।',
      });
      return;
    }

    const body = req.body || {};

    // Spam honeypot & timing defense
    if (typeof body.website_url === 'string' && body.website_url.trim().length > 0) {
      res.status(400).json({ error: 'Automated spam validation rejected this submission.' });
      return;
    }
    if (typeof body.submittedAfterMs === 'number' && body.submittedAfterMs < 800) {
      res.status(400).json({ error: 'Please review your application details before submitting.' });
      return;
    }

    // Explicitly reject financial/bank sensitive credentials
    if (
      'cardNumber' in body ||
      'cvv' in body ||
      'bankAccount' in body ||
      'bankAccountNumber' in body ||
      'pin' in body ||
      'otp' in body ||
      'password' in body
    ) {
      res.status(400).json({
        error:
          'Security Safeguard: Scholarship আবেদনের জন্য কোনো ব্যাংক কার্ড, অ্যাকাউন্ট নম্বর, পাসওয়ার্ড বা সংবেদনশীল আর্থিক তথ্য প্রদান করবেন না।',
      });
      return;
    }

    const courseCodeRaw = typeof body.courseCode === 'string' ? body.courseCode.trim() : '';
    const course = getCourseByCodeOrSlug(courseCodeRaw);

    if (!course) {
      res.status(400).json({
        error: 'অনুমোদিত তালিকা থেকে একটি বৈধ কোর্স নির্বাচন করুন।',
      });
      return;
    }

    if (course.isFree) {
      res.status(400).json({
        error:
          'Free Programmes-এর ক্ষেত্রে Scholarship প্রযোজ্য নয়; এই কোর্সটি ইতিমধ্যে সবার জন্য সম্পূর্ণ বিনামূল্যে উন্মুক্ত।',
      });
      return;
    }

    // Atomic check of approved scholarships quota (max 5)
    const approvedCount = db
      .prepare("SELECT COUNT(*) as c FROM scholarship_applications WHERE course_code = ? AND status = 'Approved'")
      .get(course.code) as { c: number };

    if (approvedCount.c >= 5) {
      res.status(409).json({
        error: `এই কোর্সের (${course.code}) জন্য নির্ধারিত Scholarship কোটা (সর্বোচ্চ ৫ জন) পূর্ণ হয়েছে। অনুগ্রহ করে পরবর্তী ব্যাচের জন্য অপেক্ষা করুন বা অন্য কোনো কোর্সের জন্য আবেদন করুন।`,
      });
      return;
    }

    const applicantName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const educationOrProfession =
      typeof body.educationOrProfession === 'string' ? body.educationOrProfession.trim() : '';
    const learningMotivation =
      typeof body.learningMotivation === 'string' ? body.learningMotivation.trim() : '';
    const financialNeedReason =
      typeof body.financialNeedReason === 'string' ? body.financialNeedReason.trim() : '';
    const commitmentStatement =
      typeof body.commitmentStatement === 'string' ? body.commitmentStatement.trim() : '';
    const privacyConsent = body.privacyConsent === true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      applicantName.length < 2 ||
      applicantName.length > 120 ||
      !emailRegex.test(email) ||
      phone.length < 6 ||
      phone.length > 40 ||
      educationOrProfession.length < 2 ||
      educationOrProfession.length > 160 ||
      learningMotivation.length < 15 ||
      learningMotivation.length > 3000 ||
      financialNeedReason.length < 15 ||
      financialNeedReason.length > 3000 ||
      commitmentStatement.length < 10 ||
      commitmentStatement.length > 3000 ||
      !privacyConsent
    ) {
      res.status(400).json({
        error:
          'দয়া করে আপনার পূর্ণ নাম, বৈধ ইমেইল, সচল ফোন নম্বর, শিক্ষাগত বা পেশাগত পরিচয়, শেখার আগ্রহ, আর্থিক প্রয়োজনের কারণ এবং কোর্স সম্পন্ন করার প্রতিশ্রুতি পূরণ করে Privacy Policy-তে সম্মতি দিন।',
      });
      return;
    }

    // Check if matching authenticated user
    let linkedUserId: string | null = req.authUser ? req.authUser.id : null;
    if (!linkedUserId) {
      const match = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as
        | { id: string }
        | undefined;
      if (match) linkedUserId = match.id;
    }

    const referenceId = `AAE-SCH-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const id = `sch_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO scholarship_applications (
        id, reference_id, user_id, course_code, course_title, applicant_name, email, phone,
        education_or_profession, learning_motivation, financial_need_reason, commitment_statement,
        requested_waiver_pct, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 50, 'Submitted', ?)
    `).run(
      id,
      referenceId,
      linkedUserId,
      course.code,
      course.title,
      applicantName,
      email,
      phone,
      educationOrProfession,
      learningMotivation,
      financialNeedReason,
      commitmentStatement,
      now
    );

    if (linkedUserId) {
      createNotification({
        userId: linkedUserId,
        type: 'scholarship',
        title: `Scholarship Application Received: ${course.title}`,
        message: `Your scholarship application (${referenceId}) for up to 50% waiver has been submitted and is queued for academic review.`,
        link: '/scholarships',
      });
    }

    res.status(201).json({
      status: 'submitted',
      referenceId,
      courseCode: course.code,
      courseTitle: course.title,
      requestedWaiverPct: 50,
      message:
        'আপনার Scholarship আবেদনটি সফলভাবে গ্রহণ করা হয়েছে। আবেদনকারীর তথ্য ও প্রয়োজনীয়তা মূল্যায়ন করে ফলাফল জানানো হবে।',
      disclosure:
        'Atlas AI Education কখনো ব্যাংক কার্ড নম্বর, PIN বা সংবেদনশীল আর্থিক তথ্য দাবি করে না। আবেদনকারীর তথ্য সুরক্ষিতভাবে সংরক্ষিত থাকবে।',
    });
  });

  // Learner's own scholarship applications (authenticated)
  app.get('/api/scholarships/my', requireAuth, (req: AuthedRequest, res: Response) => {
    const userId = req.authUser!.id;
    const userEmail = req.authUser!.email.toLowerCase();

    const applications = db
      .prepare(`
        SELECT s.id, s.reference_id, s.course_code, s.course_title,
               s.requested_waiver_pct, s.approved_waiver_pct, s.status,
               s.admin_notes, s.created_at, s.reviewed_at,
               c.fee_display as fee, c.category_name
        FROM scholarship_applications s
        JOIN courses c ON c.code = s.course_code
        WHERE s.user_id = ? OR LOWER(s.email) = ?
        ORDER BY s.created_at DESC
      `)
      .all(userId, userEmail);

    res.json({ applications });
  });

  // Unknown API endpoints return JSON 404
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  let vite: ViteDevServer | undefined;
  const distDir = path.resolve(process.cwd(), 'dist');

  if (!IS_PROD) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      express.static(distDir, {
        index: false,
      })
    );
  }

  // Catch-all HTML route with per-route SEO metadata & proper 404 status for unknown pages
  app.get('*', async (req: Request, res: Response) => {
    try {
      const reqPath = req.path;
      const baseUrl = getBaseUrl(req);
      const templatePath = IS_PROD
        ? path.resolve(distDir, 'index.html')
        : path.resolve(process.cwd(), 'index.html');

      let rawHtml = fs.readFileSync(templatePath, 'utf-8');
      if (!IS_PROD && vite) {
        rawHtml = await vite.transformIndexHtml(req.originalUrl, rawHtml);
      }

      const { html, isKnown } = injectRouteSeoHtml(rawHtml, reqPath, baseUrl);
      res.status(isKnown ? 200 : 404).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (err) {
      if (vite) vite.ssrFixStacktrace(err as Error);
      res.status(500).end('Internal Server Error');
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Atlas AI Education server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
