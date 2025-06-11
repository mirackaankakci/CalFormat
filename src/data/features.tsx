import React from 'react';
import { Leaf, Shield, Clock, Users } from 'lucide-react';

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export const features: Feature[] = [
  {
    icon: <Leaf className="w-8 h-8 text-[#ee7f1a]" />,
    title: "%100 Doğal İçerik",
    description: "Tamamen doğal bileşenlerden üretilmiş, kimyasal katkı maddesi içermez",
    color: "from-green-50 to-emerald-50"
  },
  {
    icon: <Shield className="w-8 h-8 text-[#ee7f1a]" />,
    title: "Etkili Temizlik",
    description: "Pestisit, balmumu ve zararlı kalıntıları etkili şekilde temizler",
    color: "from-blue-50 to-cyan-50"
  },
  {
    icon: <Clock className="w-8 h-8 text-[#ee7f1a]" />,
    title: "Hızlı ve Kolay",
    description: "Sadece 30 saniyede meyve ve sebzelerinizi temizleyin",
    color: "from-purple-50 to-violet-50"
  },
  {
    icon: <Users className="w-8 h-8 text-[#ee7f1a]" />,
    title: "Aile Dostu",
    description: "Bebek ve çocuklar için güvenli, non-toksik formül",
    color: "from-pink-50 to-rose-50"
  }
];