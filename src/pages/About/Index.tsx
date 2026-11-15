import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Globe, Award, ArrowRight } from "lucide-react";

export const About: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-20 sm:space-y-28 pb-20"
    >
      {/* Hero Header */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-black text-white">
        <motion.img
          initial={{ scale: 1.08, opacity: 0.3 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=2000&q=80"
          alt="Atelier Paris Studio"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-4"
        >
          <span className="px-3.5 py-1 rounded-full bg-[#D6FF00] text-black font-black text-xs uppercase tracking-widest inline-block shadow-sm">
            The Atelier Manifesto
          </span>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight">
            Enduring Form. <br />
            Tactile Materiality.
          </h1>
          <p className="text-xs sm:text-base text-gray-300 max-w-xl mx-auto font-light leading-relaxed">
            Founded in Paris to challenge ephemeral fashion cycles with architectural tailoring,
            uncompromised materials, and quiet luxury.
          </p>
        </motion.div>
      </section>

      {/* Philosophy Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6"
          >
            <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block">
              Our Design Philosophy
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-black leading-tight">
              A Wardrobe Designed As Living Architecture.
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light">
              Atelier operates at the intersection of haute couture precision and relaxed streetwear
              proportions. Every dropped shoulder, curved seam, and jetted pocket is drafted through
              months of draping iterations on the human body.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light">
              We reject synthetic poly-blends in favor of heavy Italian virgin wools, 22-momme mulberry
              silk satin, and vegetable-tanned Tuscan calfskin that patinas with beauty over decades.
            </p>

            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest hover:bg-neutral-900 transition-all shadow-md active:scale-95"
              >
                <span>View The Autumn/Winter Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-gray-100"
          >
            <img
              src="https://images.unsplash.com/photo-1544022613-e87ce7526edb?auto=format&fit=crop&w=1200&q=80"
              alt="Atelier Tailoring"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
            />
          </motion.div>
        </div>
      </section>

      {/* Sustainable Values Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
            Our Pillars
          </span>
          <h2 className="text-2xl sm:text-4xl font-black uppercase text-black">
            Crafted for Longevity
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: ShieldCheck,
              title: "Certified Sourcing",
              text: "100% of our wool fibers originate from ethically-certified family ranches with zero-mulesing guarantees, audited biannually in accordance with OEKO-TEX Standard 100.",
            },
            {
              icon: Award,
              title: "Generational Ateliers",
              text: "We partner exclusively with multi-generational master tailors and leather cobblers in Biella, Milan, and Porto, guaranteeing living wages and preserving ancient trades.",
            },
            {
              icon: Globe,
              title: "Circular Care",
              text: "Every Atelier piece includes lifetime complimentary repairs at our Paris and New York studios. When garments reach their twilight, we repurpose fibers into new knits.",
            },
          ].map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-3xl bg-white border border-gray-100 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-black text-[#D6FF00] flex items-center justify-center font-bold">
                <pillar.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black uppercase text-black">{pillar.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-light">
                {pillar.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default About;

