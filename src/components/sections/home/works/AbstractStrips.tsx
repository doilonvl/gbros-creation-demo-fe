import styles from "./AbstractStrips.module.css";

export type AbstractStripsProps = {
  className?: string;
};

export default function AbstractStrips({
  className = "",
}: AbstractStripsProps) {
  const rootClassName = className
    ? `${styles.abstractStrips} ${className}`
    : styles.abstractStrips;

  return (
    <section className={rootClassName} aria-hidden="true">
      <div className={styles.abstractStripsStrip} />
      <div className={styles.abstractStripsStrip} />
      <div className={styles.abstractStripsStrip} />
      <div className={styles.abstractStripsStrip} />
      <div className={styles.abstractStripsStrip} />
      <div className={styles.abstractStripsStrip} />
      <div className={styles.abstractStripsStrip} />
      <div className={styles.abstractStripsStrip} />
    </section>
  );
}
