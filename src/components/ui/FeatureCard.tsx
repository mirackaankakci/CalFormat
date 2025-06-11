import React from 'react';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface FeatureCardProps {
  feature: FeatureProps;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  return (
    <div 
      className={`group bg-gradient-to-br ${feature.color} p-8 rounded-3xl border border-orange-100/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:rotate-1 cursor-pointer relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#ee7f1a]/5 to-[#e5b818]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
          {feature.icon}
        </div>
        <h4 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-[#ee7f1a] transition-colors duration-300">
          {feature.title}
        </h4>
        <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
          {feature.description}
        </p>
      </div>
    </div>
  );
};

export default FeatureCard;