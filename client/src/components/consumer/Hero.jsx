import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion'; // Import motion for animations
import banner1 from '../../assets/banner_1.png';
import banner2 from '../../assets/banner_2.png';
import banner3 from '../../assets/banner_3.png';
import banner4 from '../../assets/banner_4.png';

const Hero = ({
  title = "Make Every Celebration",
  highlightWord = "Unforgettable",
  description = "Discover our collection of premium party supplies that turn ordinary moments into extraordinary memories.",
  primaryButtonText = "Shop Now",
  primaryButtonLink = "/products",
  secondaryButtonText = "Browse Categories",
  secondaryButtonLink = "/categories",
  featureText = "Free shipping on orders over ₹50"
}) => {
  // Original hero decorative background as a slide
  const BackgroundDecor = () => (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-yellow-300 opacity-20 rounded-full blur-xl" />
      <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-pink-300 opacity-20 rounded-full blur-lg" />
      <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-purple-300 opacity-20 rounded-full blur-xl" />
      <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-blue-300 opacity-15 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2" />
    </div>
  );

  const slides = useMemo(() => ([
    { type: 'decor', alt: 'Original hero background' },
    { type: 'image', src: banner1, alt: 'Celebration banner 1' },
    { type: 'image', src: banner2, alt: 'Celebration banner 2' },
    { type: 'image', src: banner3, alt: 'Celebration banner 3' },
    { type: 'image', src: banner4, alt: 'Celebration banner 4' },
  ]), []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [isPaused, slides.length]);

  const goTo = (idx) => setCurrentIndex(((idx % slides.length) + slides.length) % slides.length);
  const goNext = () => goTo(currentIndex + 1);
  const goPrev = () => goTo(currentIndex - 1);

  // Animation variants for text and buttons
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delayChildren: 0.2, // Delay for children to animate after container
        staggerChildren: 0.1 // Stagger animation for child elements
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 10 } }
  };

  return (
    <div
      className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Background carousel */}
      <div className="absolute inset-0">
        {slides.map((slide, idx) => (
          <motion.div
            key={idx}
            className="absolute inset-0 will-change-transform will-change-opacity"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: idx === currentIndex ? 1 : 0, scale: idx === currentIndex ? 1 : 1.02 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            {slide.type === 'image' ? (
              <Link to={primaryButtonLink} aria-label="Shop products" className="absolute inset-0 block cursor-pointer">
                <img src={slide.src} alt={slide.alt} className="absolute inset-0 h-full w-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent md:from-black/60 md:via-black/30" />
              </Link>
            ) : (
              <BackgroundDecor />
            )}
          </motion.div>
        ))}
      </div>

      {/* Main content container - only show on 'decor' slide */}
      {slides[currentIndex]?.type === 'decor' && (
        <div className="container mx-auto px-4 relative z-10 py-16 md:py-0"> {/* Added padding for smaller screens */}
          <motion.div
            // Added space-y-6 for consistent vertical spacing between content blocks
            className="max-w-2xl text-white text-center md:text-left space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 className="text-4xl md:text-6xl font-bold leading-tight" variants={itemVariants}> {/* Removed mb-4 */}
              {title} <span className="text-yellow-300">{highlightWord}</span>
            </motion.h1>

            <motion.p className="text-lg md:text-xl text-white/90" variants={itemVariants}> {/* Removed mb-8 */}
              {description}
            </motion.p>

            <motion.div
              // FIX: Use space-y-4 for vertical gap on mobile and space-x-4 for horizontal gap on larger screens
              className="flex flex-col space-y-10 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center md:justify-start"
              variants={containerVariants} // Use container variants for button group
            >
              <motion.div variants={buttonVariants}> {/* Wrap Link in motion.div */}
                <Link
                  to={primaryButtonLink}
                  className="w-full sm:w-auto bg-white text-pink-600 hover:bg-yellow-300 hover:text-purple-700 px-8 py-3 rounded-full font-bold transition-all duration-300 text-center shadow-lg"
                  aria-label={primaryButtonText} // Added for accessibility
                >
                  {primaryButtonText}
                </Link>
              </motion.div>
              <motion.div variants={buttonVariants}> {/* Wrap Link in motion.div */}
                <Link
                  to={secondaryButtonLink}
                  className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-medium transition-all duration-300 text-center"
                  aria-label={secondaryButtonText} // Added for accessibility
                >
                  {secondaryButtonText}
                </Link>
              </motion.div>
            </motion.div>

            <motion.div className="flex items-center justify-center md:justify-start text-sm" variants={itemVariants}> {/* Removed mt-12 */}
              <PartyPopper className="mr-2 text-yellow-300" size={20} aria-hidden="true" /> {/* aria-hidden for decorative icon */}
              <span>{featureText}</span>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Controls */}
      {slides.length > 1 && (
        <div className="pointer-events-none absolute inset-0 hidden md:flex items-center justify-between px-2 md:px-4 z-10">
          <button
            aria-label="Previous slide"
            onClick={goPrev}
            className="pointer-events-auto inline-flex items-center justify-center h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
          >
            ‹
          </button>
          <button
            aria-label="Next slide"
            onClick={goNext}
            className="pointer-events-auto inline-flex items-center justify-center h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
          >
            ›
          </button>
        </div>
      )}

      {/* Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => goTo(idx)}
              className={`h-2.5 w-2.5 md:h-2.5 md:w-2.5 rounded-full transition ${idx === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Hero;
