import { motion } from 'framer-motion';

const PageHero = ({ eyebrow, title, description, highlights = [], actions = null }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-hero"
    >
      <div className="page-hero__glow" />
      <div className="relative grid gap-6 lg:grid-cols-[1.7fr_1fr] lg:items-end">
        <div className="space-y-4">
          {eyebrow ? <div className="hero-badge">{eyebrow}</div> : null}
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
            {description ? (
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">{description}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-stretch justify-start gap-3 lg:justify-end">
          {highlights.map((item) => (
            <div key={item.label} className="hero-highlight">
              <p className="hero-highlight__label">{item.label}</p>
              <p className="hero-highlight__value">{item.value}</p>
              {item.helper ? <p className="hero-highlight__helper">{item.helper}</p> : null}
            </div>
          ))}
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
      </div>
    </motion.section>
  );
};

export default PageHero;
