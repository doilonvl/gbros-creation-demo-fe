/* eslint-disable @next/next/no-html-link-for-pages */
import styles from "./services.module.css";

const tiers = [
  {
    name: "Premium Studio",
    price: "$980",
    sub: "Full production",
    desc: "For brand launches, hero campaigns, and high-touch art direction.",
    accent: "gold",
    features: [
      "Creative direction + shotlist",
      "Producer + senior photographer",
      "Styling & set design support",
      "Up to 30 final edits",
      "Delivery in 5-7 business days",
    ],
  },
  {
    name: "Signature",
    price: "$690",
    sub: "Best seller",
    desc: "Balanced package for seasonal drops and catalog refreshes.",
    accent: "amber",
    badge: "Best Seller",
    features: [
      "Studio setup + lighting plan",
      "Lead photographer",
      "Up to 20 final edits",
      "2 rounds of retouch",
      "Delivery in 5 business days",
    ],
  },
  {
    name: "Smart",
    price: "$420",
    sub: "Lean shoot",
    desc: "Fast, efficient sessions for consistent product output.",
    accent: "sage",
    features: [
      "Compact set",
      "Producer/photographer",
      "Up to 12 final edits",
      "1 round of retouch",
      "Delivery in 3-4 business days",
    ],
  },
  {
    name: "Monthly",
    price: "From $1.9k",
    sub: "Retainer",
    desc: "Ongoing content for e-commerce and social at scale.",
    accent: "slate",
    features: [
      "Monthly planning session",
      "Priority booking",
      "Flexible edit volume",
      "Content calendar support",
      "Rolling delivery",
    ],
  },
];

export default function ServicesPage() {
  return (
    <main className={styles.page} data-nav-theme="light">
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.kicker}>Services & Pricing</h1>
          <p className={styles.lede}>
            Choose a service tier that fits your production scale. Each package
            includes professional studio lighting, direction, and retouching
            tuned for brand consistency.
          </p>
        </div>
      </section>

      <section className={styles.pricing}>
        <div className={styles.grid}>
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`${styles.card} ${styles[`card${tier.accent}`]}`}
            >
              <div className={styles.cardTop}>
                <div className={styles.cardHeader}>
                  <h3>{tier.name}</h3>
                  {tier.badge && (
                    <span className={styles.badge}>{tier.badge}</span>
                  )}
                </div>
                <div className={styles.price}>{tier.price}</div>
                <p className={styles.sub}>{tier.sub}</p>
                <p className={styles.desc}>{tier.desc}</p>
              </div>

              <div className={styles.cardBody}>
                <ul className={styles.features}>
                  {tier.features.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <a
                  className={styles.cta}
                  href="https://www.facebook.com/gbros.creation?rdid=FuLafaKGrJPYl6XN&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F17dZLvoMAF%2F#"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Request quote
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
