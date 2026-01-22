(() => {
    const navToggle = document.querySelector(".mobile-toggle");
    const nav = document.querySelector(".nav-links");

    if (navToggle && nav) {
        navToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = nav.classList.toggle("is-open");
            navToggle.setAttribute("aria-expanded", String(isOpen));
        });

        // Close menu when clicking outside
        document.addEventListener("click", (e) => {
            if (nav.classList.contains("is-open") && !nav.contains(e.target) && !navToggle.contains(e.target)) {
                nav.classList.remove("is-open");
                navToggle.setAttribute("aria-expanded", "false");
            }
        });

        // Close menu when clicking a link
        nav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                nav.classList.remove("is-open");
                navToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    // --- Video Modal Logic ---
    // Inject the modal HTML into the DOM dynamically
    const modalHTML = `
        <div id="video-modal" class="video-modal">
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <button class="modal-close" aria-label="Close video">×</button>
                <div class="video-wrapper">
                    <!-- Placeholder iframe -->
                    <iframe id="video-frame" src="" title="Video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('video-modal');
    const iframe = modal.querySelector('#video-frame');
    const closeBtn = modal.querySelector('.modal-close');
    const backdrop = modal.querySelector('.modal-backdrop');

    // Placeholder video ID (Bloomberg global financial news or similar generic tech/finance clip)
    const DEFAULT_VIDEO = "https://www.youtube.com/embed/SltxJ3n8UQA?autoplay=1&mute=0&rel=0";

    function openModal() {
        iframe.src = DEFAULT_VIDEO;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock scroll
    }

    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => { iframe.src = ""; }, 300); // Clear source after fade out to stop sound
        document.body.style.overflow = '';
    }

    // Bind to Large Play Button
    const largePlayBtn = document.querySelector('.play-btn-large');
    if (largePlayBtn) {
        largePlayBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    // Bind to Side Video List Items
    const sideVideos = document.querySelectorAll('.video-item-small');
    sideVideos.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent empty link navigation
            openModal();
        });
    });

    // Close logic
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

})();

