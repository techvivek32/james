import Image from "next/image";
import { UserProfile } from "../../types";
import headerLogo from "../../../ref. images/ChatGPT_Image_Feb_23__2026__07_00_52_PM-removebg-preview.png";
import footerImage from "../../../ref. images/image.png";

export function WebPagePreview(props: {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}) {
  const profile = props.profile;
  const slug = profile.name
    .toLowerCase()
    .replace(/\s+/g, "");
  const url = `https://www.millerstorm.com/team/${slug}`;
  const shortUrl = `https://ms.millerstorm.com/${slug}`;

  const missionTitle = profile.missionTitle || profile.name || "MY BIO";
  const missionBody = profile.missionBody ?? profile.bio ?? "";
  const marketingMaterialsNotes = profile.marketingMaterialsNotes ?? "";
  const missionCtaLabel = profile.missionCtaLabel || "MAKE AN APPOINTMENT";
  function pickImageUrl(...urls: (string | undefined)[]) {
    for (const u of urls) {
      const url = (u ?? "").trim();
      if (!url) continue;
      if (/^(https?:\/\/|blob:|data:image)/.test(url)) {
        return url;
      }
    }
    return "";
  }
  const missionImageUrl = pickImageUrl(profile.headshotUrl, profile.missionImageUrl);
  const whyUsTitle = profile.whyUsTitle || "HERE'S WHY YOU NEED US";
  const whyUsBody =
    profile.whyUsBody || marketingMaterialsNotes || "";
  const expertRoofersTitle =
    profile.expertRoofersTitle || "EXPERT ROOFERS AT YOUR SERVICE";
  const expertRoofersBody = profile.expertRoofersBody || "";
  const splitParagraphs = (value: string) =>
    value
      .split(/\n\s*\n/g)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  const missionParagraphs = splitParagraphs(missionBody);
  const whyUsParagraphs = splitParagraphs(whyUsBody);
  const expertRoofersParagraphs = splitParagraphs(expertRoofersBody);
  const showEmail = profile.publicProfile?.showEmail ?? false;
  const showPhone = profile.publicProfile?.showPhone ?? false;
  const contactEmail = showEmail ? profile.email : "";
  const contactPhone = showPhone ? (profile.phone ?? "") : "";

  function submitForApproval() {
    if (profile.webPage?.status === "published") {
      alert("Web page is already published.");
      return;
    }
    props.onProfileChange({
      ...profile,
      webPage: {
        ...(profile.webPage ?? {}),
        status: "published"
      }
    });
    alert("✓ Web page published successfully!");
  }

  function openPreview() {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="web-preview">
      <div className="panel-header">Sales Rep Web Page Preview</div>
      <div className="web-preview-actions">
        <button
          type="button"
          className="btn-secondary btn-dark btn-small"
          onClick={openPreview}
        >
          Preview
        </button>
        <button
          type="button"
          className="btn-primary btn-success btn-small"
          onClick={submitForApproval}
        >
          Save & Publish
        </button>
      </div>
      <div className="web-preview-url">{url}</div>
      <div className="ms-header-preview">
        <div className="ms-header-top">
          <div className="ms-header-top-text" style={{ fontSize: 20, fontWeight: 600 }}>
            24/7 Emergency Service Available: Call or Text (817) 367-0843
          </div>
        </div>
        <div className="ms-header-main">
          <div className="ms-header-logo-centered">
            <Image
              src={headerLogo}
              alt="Miller Storm header logo"
              width={220}
              height={90}
              className="ms-header-logo-image"
            />
          </div>
        </div>
      </div>
      <div className="ms-mission">
        <div className="ms-mission-card">
          <div className="ms-mission-text">
            <div className="ms-mission-title">{missionTitle}</div>
            <div className="ms-mission-body">
              {missionParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="ms-mission-image">
            {missionImageUrl ? (
              <img
                src={missionImageUrl}
                alt="Miller Storm team"
                className="ms-mission-image-img"
              />
            ) : (
              <div className="ms-mission-image-placeholder">
                Mission image placeholder
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="ms-copy">
        {whyUsBody.trim() && (
          <div className="ms-copy-section">
            <div className="ms-copy-title">{whyUsTitle}</div>
            <div className="ms-copy-body">
              {whyUsParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}
        {expertRoofersBody.trim() && (
          <div className="ms-copy-section">
            <div className="ms-copy-title">{expertRoofersTitle}</div>
            <div className="ms-copy-body">
              {expertRoofersParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="ms-testimonials">
        <div className="ms-testimonials-grid">
          <div className="ms-testimonial-card">
            <div className="ms-testimonial-stars">★★★★★</div>
            <div className="ms-testimonial-body">
              Seth and team were fantastic to work with!
            </div>
            <div className="ms-testimonial-footer">
              <div className="ms-testimonial-name">Lori M.</div>
              <div className="ms-testimonial-source">Google Reviews</div>
            </div>
          </div>
          <div className="ms-testimonial-card">
            <div className="ms-testimonial-stars">★★★★★</div>
            <div className="ms-testimonial-body">
              When we had hail damage in October of '23, as first time
              homebuyers, we didn't know how to proceed with our roof
              replacement. We were bombarded with knocks on our door...
            </div>
            <div className="ms-testimonial-footer">
              <div className="ms-testimonial-name">Clayton G.</div>
              <div className="ms-testimonial-source">facebook</div>
            </div>
          </div>
          <div className="ms-testimonial-card">
            <div className="ms-testimonial-stars">★★★★★</div>
            <div className="ms-testimonial-body">
              This company is GREAT. Phil was my contact, he did an excellent
              job. I had one conversation with my insurance company and he did
              the rest. Phil checked with me throughout the...
            </div>
            <div className="ms-testimonial-footer">
              <div className="ms-testimonial-name">Gary G.</div>
              <div className="ms-testimonial-source">Google Reviews</div>
            </div>
          </div>
        </div>
      </div>
      <div className="ms-review-strip">
        <div className="ms-review-strip-grid">
          <div className="ms-review-strip-item">
            <div className="ms-review-strip-stars">★★★★★</div>
            <div className="ms-review-strip-text">100% Recommended</div>
            <div className="ms-review-strip-brand">facebook reviews</div>
          </div>
          <div className="ms-review-strip-item">
            <div className="ms-review-strip-stars">★★★★★</div>
            <div className="ms-review-strip-text">5/5 Perfect Rating</div>
            <div className="ms-review-strip-brand">BBB Accredited Business</div>
          </div>
          <div className="ms-review-strip-item">
            <div className="ms-review-strip-stars">★★★★★</div>
            <div className="ms-review-strip-text">Over 200 Reviews</div>
            <div className="ms-review-strip-brand">Google Reviews</div>
          </div>
          <div className="ms-review-strip-item">
            <div className="ms-review-strip-stars">★★★★★</div>
            <div className="ms-review-strip-text">5.0 Star Rating</div>
            <div className="ms-review-strip-brand">HomeAdvisor</div>
          </div>
        </div>
      </div>
      <div className="ms-footer">
        <div className="ms-footer-centered">
          <div className="ms-footer-left-title">CONTACT US</div>
          <div className="ms-footer-left-body">
            Contact us today or schedule your free drone inspection and let us
            help you discover the perfect solution for your home or business.
          </div>
          <div className="ms-footer-social">
            <a
              href="https://www.facebook.com/millerstormroofing?_rdc=2&_rdr#"
              target="_blank"
              rel="noopener noreferrer"
              className="ms-footer-social-link"
              aria-label="Facebook"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M13.8 8.9V7.2c0-.9.6-1.2 1.1-1.2h1.7V3.1h-2.3c-2.5 0-3.8 1.5-3.8 3.8v2h-2v2.7h2V21h3V11.6h2.4l.4-2.7H13.8z"
                />
              </svg>
            </a>
            <span className="ms-footer-social-icon" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-5 3.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5zm4.25-3.1a.9.9 0 1 1-.9-.9.9.9 0 0 1 .9.9z"
                />
              </svg>
            </span>
            <a
              href="https://www.linkedin.com/company/miller-storm-roofing-and-reconstruction/"
              target="_blank"
              rel="noopener noreferrer"
              className="ms-footer-social-link"
              aria-label="LinkedIn"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h4v1.7c.6-1 1.7-2 3.7-2 3 0 4.3 1.9 4.3 5.1V21h-4v-6c0-1.5-.5-2.6-1.9-2.6-1 0-1.6.7-1.9 1.4-.1.2-.1.6-.1.9V21H9z"
                />
              </svg>
            </a>
            <a
              href="https://www.youtube.com/channel/UCTRZ-XaVO671kF4tOHm65BA"
              target="_blank"
              rel="noopener noreferrer"
              className="ms-footer-social-link"
              aria-label="YouTube"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3a2.7 2.7 0 0 0-1.9 1.9C2 9 2 12 2 12s0 3 .3 4.8a2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9C22 15 22 12 22 12s0-3-.4-4.8zM10 15V9l5 3-5 3z"
                />
              </svg>
            </a>
          </div>
          <div className="ms-footer-left-phone">
            <div className="ms-footer-contact">
              {contactPhone && (
                <a href={`tel:${contactPhone}`} className="ms-footer-link ms-footer-contact-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M6.6 10.8c1.2 2.3 3.3 4.4 5.6 5.6l2-2c.3-.3.8-.4 1.2-.2 1 .3 2 .5 3.1.5.7 0 1.3.6 1.3 1.3V20c0 .7-.6 1.3-1.3 1.3C10.9 21.3 2.7 13.1 2.7 3.3 2.7 2.6 3.3 2 4 2h3.2c.7 0 1.3.6 1.3 1.3 0 1.1.2 2.1.5 3.1.1.4 0 .9-.3 1.2l-2.1 2.2z"
                    />
                  </svg>
                  <span>{contactPhone}</span>
                </a>
              )}
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="ms-footer-link ms-footer-contact-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.01L12 12l8-5.99V6H4zm16 12V8l-8 6-8-6v10h16z"
                    />
                  </svg>
                  <span>{contactEmail}</span>
                </a>
              )}
            </div>
          </div>
          <div className="ms-footer-copy">
            © 2026-2027{" "}
            <a
              href="https://millerstorm.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="ms-footer-link"
            >
              Miller Storm
            </a>
            . All Rights Reserved.
          </div>
          <div className="ms-footer-image">
            <Image
              src={footerImage}
              alt="Miller Storm footer"
              width={140}
              height={60}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
