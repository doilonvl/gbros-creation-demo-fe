"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Member = {
  name: string;
  role: string;
  image: string;
};

type AboutTeamRevealProps = {
  members: Member[];
};

export default function AboutTeamReveal({ members }: AboutTeamRevealProps) {
  const [active, setActive] = useState<Member | null>(null);

  return (
    <div className="relative">
      <ul className="space-y-4">
        {members.map((member) => (
          <li key={member.name}>
            <button
              type="button"
              className="text-left text-2xl font-[var(--font-caladea)] uppercase tracking-[0.2em] text-neutral-600 transition hover:text-neutral-900"
              onMouseEnter={() => setActive(member)}
              onFocus={() => setActive(member)}
              onMouseLeave={() => setActive(null)}
              onBlur={() => setActive(null)}
            >
              {member.name}
              <span className="ml-4 text-xs uppercase tracking-[0.3em] text-neutral-400">
                {member.role}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="pointer-events-none fixed inset-0 z-30 hidden items-center justify-center lg:flex">
        <AnimatePresence>
          {active ? (
            <motion.div
              key={active.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative h-[60vh] w-[40vw] overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-white shadow-[0_40px_120px_-60px_rgba(15,23,42,0.35)]"
            >
              <img
                src={active.image}
                alt={active.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-xs uppercase tracking-[0.4em] text-white/70">
                  {active.role}
                </p>
                <p className="mt-2 text-2xl font-[var(--font-caladea)] uppercase tracking-[0.2em] text-white">
                  {active.name}
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
