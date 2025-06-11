import React from 'react';
import FeatureCard from '../ui/FeatureCard';
import SectionTitle from '../ui/SectionTitle';
import { features } from '../../data/features';

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-white via-orange-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle 
          badge="Özellikler"
          title="Neden CalFormat?"
          description="Ailenizin sağlığı için en doğal ve etkili çözümü sunuyoruz"
        />
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;