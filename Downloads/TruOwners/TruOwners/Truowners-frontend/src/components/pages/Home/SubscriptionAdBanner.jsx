import React from 'react';
import { Box, Typography, Button, Container, useTheme, useMediaQuery } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// Assets (using placeholders or existing icons if available, for now using emojis/text)
// You can replace these with actual image imports later

const ads = [
  {
    id: 1,
    title: "Zero Brokerage, 100% Trust",
    subtitle: "Connect directly with verified owners. No middlemen, no hidden fees.",
    cta: "Explore Plans",
    bgGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    title: "Unlock Verified Owners",
    subtitle: "Get access to contact details of genuine property owners instantly.",
    cta: "Get Access Now",
    bgGradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    title: "Premium Support & Assistance",
    subtitle: "Dedicated relationship manager to help you find your dream home faster.",
    cta: "Upgrade Today",
    bgGradient: "linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
];

const SubscriptionAdBanner = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ py: 6, bgcolor: '#f5f7fa' }}>
      <Container maxWidth="lg">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          spaceBetween={30}
          slidesPerView={1}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          loop={true}
          style={{
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}
        >
          {ads.map((ad) => (
            <SwiperSlide key={ad.id}>
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: 300, md: 400 },
                  width: '100%',
                  background: ad.bgGradient,
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}
              >
                {/* Background Image Overlay */}
                <Box
                  component="img"
                  src={ad.image}
                  alt={ad.title}
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    height: '100%',
                    width: { xs: '100%', md: '60%' },
                    objectFit: 'cover',
                    opacity: 0.2,
                    maskImage: 'linear-gradient(to left, black 50%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)'
                  }}
                />

                <Container>
                  <Box sx={{ position: 'relative', zIndex: 2, maxWidth: { xs: '100%', md: '60%' }, color: '#fff', textAlign: { xs: 'center', md: 'left' } }}>
                    <Typography
                      variant={isMobile ? "h4" : "h2"}
                      fontWeight={800}
                      gutterBottom
                      sx={{
                        textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                        lineHeight: 1.2
                      }}
                    >
                      {ad.title}
                    </Typography>
                    <Typography
                      variant={isMobile ? "body1" : "h5"}
                      sx={{ mb: 4, opacity: 0.9, fontWeight: 400 }}
                    >
                      {ad.subtitle}
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/subscription-plans')}
                      sx={{
                        bgcolor: '#fff',
                        color: '#333',
                        fontWeight: 'bold',
                        px: 4,
                        py: 1.5,
                        borderRadius: '50px',
                        fontSize: '1.1rem',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                        '&:hover': {
                          bgcolor: '#f0f0f0',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 15px 30px rgba(0,0,0,0.3)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {ad.cta}
                    </Button>
                  </Box>
                </Container>
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </Box>
  );
};

export default SubscriptionAdBanner;
