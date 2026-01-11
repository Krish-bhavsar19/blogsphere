//uts to ist time
document.querySelectorAll('[data-created]').forEach(el => {
    const date = new Date(el.dataset.created);
    el.textContent = date.toLocaleString();
});

// Loader functionality for first visit only
document.addEventListener('DOMContentLoaded', function () {
    const loader = document.getElementById('loader');
    const hasVisited = localStorage.getItem('hasVisitedHome');

    if (!hasVisited) {
        // Show loader for 2 seconds on first visit
        setTimeout(() => {
            loader.classList.add('hidden');
            document.body.style.overflow = 'auto'; // Enable scrolling after loader
            localStorage.setItem('hasVisitedHome', 'true'); // Set flag for future visits
        }, 2000);
    } else {
        // Hide loader immediately if visited before
        loader.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Enable scrolling
    }
});

// Like button functionality
document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        const postId = this.getAttribute('data-post-id');
        const isLoggedIn = this.getAttribute('data-logged-in') === 'true';

        if (!isLoggedIn) {
            window.location.href = '/user/login';
            return;
        }

        // Send like request to server
        if (postId) {
            fetch(`/posts/${postId}/like`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (typeof data.likes !== 'undefined' && typeof data.userId !== 'undefined') {
                        const icon = this.querySelector('i');
                        const count = this.nextElementSibling;
                        let liked = data.likes.some(like => like.toString() === data.userId.toString());
                        icon.classList.toggle('text-danger', liked);
                        icon.classList.toggle('text-muted', !liked);
                        count.textContent = data.likes.length;
                    }
                });
        }
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Newsletter form
document.querySelector('.newsletter-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = this.querySelector('.newsletter-input').value;
    if (email) {
        alert('Thank you for subscribing! We\'ll send you stories of goodness.');
        this.reset();
    }
});

// Navbar scroll effect
window.addEventListener('scroll', function () {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Trending Posts Slider Functionality
document.addEventListener('DOMContentLoaded', function () {
    const slider = document.getElementById('trendingSlider');
    const prevBtn = document.getElementById('trendingPrev');
    const nextBtn = document.getElementById('trendingNext');

    // Check if slider elements exist
    if (!slider || !prevBtn || !nextBtn) {
        return; // Exit if elements don't exist
    }

    const slides = slider.querySelectorAll('.slider-slide');

    if (slides.length === 0) {
        return; // Exit if no slides
    }

    let currentIndex = 0;
    let slidesToShow = 3;

    // Get slide width based on screen size
    function getSlideWidth() {
        if (window.innerWidth <= 576) {
            return 250 + 32; // 250px width + 32px gap
        } else if (window.innerWidth <= 768) {
            return 280 + 32; // 280px width + 32px gap
        } else if (window.innerWidth <= 992) {
            return 300 + 32; // 300px width + 32px gap
        } else {
            return 350 + 32; // 350px width + 32px gap
        }
    }

    // Update slides per view based on screen size
    function updateSlidesPerView() {
        if (window.innerWidth <= 768) {
            slidesToShow = 1;
        } else if (window.innerWidth <= 992) {
            slidesToShow = 2;
        } else {
            slidesToShow = 3;
        }

        // Reset position and update buttons
        currentIndex = 0;
        updateSliderPosition();
        updateButtons();
    }

    // Update slider position
    function updateSliderPosition() {
        const slideWidth = getSlideWidth();
        const translateX = -(currentIndex * slideWidth);
        slider.style.transform = `translateX(${translateX}px)`;
    }

    // Update button states
    function updateButtons() {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= slides.length - slidesToShow;
    }

    // Move to next slide
    function nextSlide() {
        if (currentIndex < slides.length - slidesToShow) {
            currentIndex++;
            updateSliderPosition();
            updateButtons();
        }
    }

    // Move to previous slide
    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex--;
            updateSliderPosition();
            updateButtons();
        }
    }

    // Event listeners
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    // Handle window resize
    window.addEventListener('resize', function () {
        updateSlidesPerView();
    });

    // Initialize
    updateSlidesPerView();

    // Auto-play functionality
    let autoPlayInterval;

    function startAutoPlay() {
        if (slides.length <= slidesToShow) {
            return; // Don't auto-play if all slides are visible
        }
        autoPlayInterval = setInterval(() => {
            if (currentIndex < slides.length - slidesToShow) {
                nextSlide();
            } else {
                // Loop back to the beginning
                currentIndex = 0;
                updateSliderPosition();
                updateButtons();
            }
        }, 3000); // Change slide every 3 seconds for faster movement
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
        }
    }

    // Start auto-play immediately
    startAutoPlay();

    // Pause auto-play on hover and resume when mouse leaves
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoPlay);
        sliderContainer.addEventListener('mouseleave', startAutoPlay);
    }

    // Pause auto-play when user interacts with navigation buttons
    prevBtn.addEventListener('mouseenter', stopAutoPlay);
    prevBtn.addEventListener('mouseleave', startAutoPlay);
    nextBtn.addEventListener('mouseenter', stopAutoPlay);
    nextBtn.addEventListener('mouseleave', startAutoPlay);

    // Resume auto-play after manual navigation
    function resumeAutoPlay() {
        setTimeout(startAutoPlay, 2000); // Resume after 2 seconds
    }

    // Override manual navigation to resume auto-play
    const originalNextSlide = nextSlide;
    const originalPrevSlide = prevSlide;

    function nextSlideWithResume() {
        originalNextSlide();
        stopAutoPlay();
        resumeAutoPlay();
    }

    function prevSlideWithResume() {
        originalPrevSlide();
        stopAutoPlay();
        resumeAutoPlay();
    }

    // Update event listeners
    nextBtn.removeEventListener('click', nextSlide);
    prevBtn.removeEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlideWithResume);
    prevBtn.addEventListener('click', prevSlideWithResume);

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
            prevSlideWithResume();
        } else if (e.key === 'ArrowRight') {
            nextSlideWithResume();
        }
    });

    // Touch/swipe support for mobile
    let startX = 0;
    let isDragging = false;

    if (sliderContainer) {
        sliderContainer.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
            isDragging = true;
            stopAutoPlay();
        });

        sliderContainer.addEventListener('touchmove', function (e) {
            if (!isDragging) return;
            e.preventDefault();
        });

        sliderContainer.addEventListener('touchend', function (e) {
            if (!isDragging) return;
            isDragging = false;

            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;

            if (Math.abs(diff) > 50) { // Minimum swipe distance
                if (diff > 0) {
                    nextSlideWithResume();
                } else {
                    prevSlideWithResume();
                }
            } else {
                // Resume auto-play if no swipe detected
                resumeAutoPlay();
            }
        });
    }
});

// Mark all notifications as read functionality
document.addEventListener('DOMContentLoaded', function () {
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationList = document.getElementById('notificationList');

    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function () {
            fetch('/user/notifications/mark-all-read', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // Remove the badge if it exists
                        if (notificationBadge) {
                            notificationBadge.remove();
                        }

                        // Update notification list to remove fw-bold class from all items
                        const notificationItems = notificationList.querySelectorAll('.dropdown-item');
                        notificationItems.forEach(item => {
                            item.classList.remove('fw-bold');
                        });
                    }
                })
                .catch(error => {
                    console.error('Error marking all notifications as read:', error);
                });
        });
    }
});
