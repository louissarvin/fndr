import { useEffect, useState } from 'react';

const stats = [
  { label: 'Total Value Locked', value: 12500000, prefix: '$', suffix: '' },
  { label: 'Startups Funded', value: 127, prefix: '', suffix: '' },
  { label: 'Active Investors', value: 2400, prefix: '', suffix: '+' },
  { label: 'Yield Distributed', value: 847230, prefix: '$', suffix: '' },
];

function AnimatedNumber({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const formattedValue = new Intl.NumberFormat('en-US', {
    notation: value >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(displayValue);

  return (
    <span className="text-4xl md:text-5xl font-bold text-foreground">
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section className="py-16 md:py-20 border-y border-border">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <AnimatedNumber 
                value={stat.value} 
                prefix={stat.prefix} 
                suffix={stat.suffix} 
              />
              <div className="text-sm text-muted-foreground mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
