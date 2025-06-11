import React from 'react';

interface SectionTitleProps {
  badge: string;
  title: string;
  description?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ badge, title, description }) => {
  return (
    <div className="text-center mb-16">
      <span className="bg-gradient-to-r from-[#ee7f1a] to-[#e5b818] text-white px-4 py-2 rounded-full text-sm font-medium">
        {badge}
      </span>
      <h3 className="text-5xl font-bold text-gray-900 mb-6 mt-4">{title}</h3>
      {description && (
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;