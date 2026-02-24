// BookBadge — Cover Loader
// Loads real book covers from Open Library (free, no API key needed)

const BOOK_COVERS = {
  "Cien años de soledad":               "9780060883287",
  "La vegetariana":                     "9781846276033",
  "Los errantes":                       "9781910702192",
  "Los años":                           "9781913097356",
  "Septología":                         "9781641293396",
  "Ensayo sobre la ceguera":            "9780156007757",
  "Todo lo que tengo lo llevo conmigo": "9780312428358",
  "Lo que queda del día":               "9780679731726",
  "Beloved":                            "9781400033416",
  "El extranjero":                      "9780679720201",
  "Life of Pi":                         "9780156027328",
  "El dios de las pequeñas cosas":      "9780679457312",
  "Wolf Hall":                          "9780312429980",
  "Hijos de la medianoche":             "9780812976533",
  "Girl, Woman, Other":                 "9780241364536",
  "Shuggie Bain":                       "9780802148506",
  "The Promise":                        "9781501151774",
  "Los testamentos":                    "9780385543781",
  "Lincoln in the Bardo":               "9780812988765",
  "Rayuela":                            "9780394752846",
  "Pedro Páramo":                       "9780802133908",
  "La casa de los espíritus":           "9781501117015",
  "Ficciones":                          "9780802130303",
  "Los detectives salvajes":            "9780312270018",
  "El túnel":                           "9780140283440",
  "Distancia de rescate":               "9780525559481",
  "La vorágine":                        "9781477303436",
  "El coronel no tiene quien le escriba":"9780061244711",
  "Don Quijote de la Mancha":           "9780142437230",
  "Anna Karénina":                      "9780140449174",
  "Crimen y castigo":                   "9780140449136",
  "Madame Bovary":                      "9780140449129",
  "Orgullo y prejuicio":                "9780141439518",
  "Moby Dick":                          "9780142437247",
  "En busca del tiempo perdido":        "9780300116038",
  "La montaña mágica":                  "9780679772873",
  "Guerra y paz":                       "9780140447934",
  "Ulises":                             "9780679722762",
  "1984":                               "9780451524935",
  "El guardián entre el centeno":       "9780316769174",
  "El gran Gatsby":                     "9780743273565",
  "La metamorfosis":                    "9780553213690",
  "Lolita":                             "9780679723165",
  "El maestro y Margarita":             "9780140455465",
  "Matar a un ruiseñor":                "9780061935466",
  "El señor de los anillos":            "9780544003415",
  "El proceso":                         "9780805209990",
  "Intermezzo":                         "9780374602635",
  "James":                              "9780385550369",
  "All Fours":                          "9781668069431",
  "The Women":                          "9781250178602",
  "Small Things Like These":            "9780802159298",
  "The God of the Woods":               "9780593473566",
  "Sunrise on the Reaping":             "9780702331787",
  "The Anxious Generation":             "9780593655030",
  "Al faro":                            "9780156907392",
  "El cuento de la criada":             "9780385490818",
  "Normal People":                      "9780571334650",
  "La amiga estupenda":                 "9781609452063",
  "North Sun":                          "9781646053582",
  "Headstrong":                         "9781540903419",
  "Sleeping Worlds Have No Memory":     "9781645480297",
};

function loadBookCovers() {
  // Selectors that contain book covers in both index.html and app.html
  const coverSelectors = [
    '.cat-book-cover',
    '.book-cover',
    '.hot-cover-lg',
    '.hot-side-cover',
    '.trend-cover-mini',
    '.radar-cover',
    '.hist-cover',
    '.sug-cover',
    '.app-book-spine',
  ];

  coverSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(coverEl => {
      // Find the title text within this cover or its parent .cat-book / .book-card
      let titleEl =
        coverEl.querySelector('.cat-book-title') ||
        coverEl.querySelector('.book-title') ||
        coverEl.querySelector('.hot-title') ||
        coverEl.querySelector('.trend-title') ||
        coverEl.querySelector('.radar-title') ||
        coverEl.querySelector('.hist-title') ||
        coverEl.querySelector('.sug-title') ||
        coverEl.querySelector('.app-book-title');

      // If not inside, look in parent
      if (!titleEl && coverEl.parentElement) {
        titleEl =
          coverEl.parentElement.querySelector('.cat-book-title') ||
          coverEl.parentElement.querySelector('.book-title') ||
          coverEl.parentElement.querySelector('.hot-title') ||
          coverEl.parentElement.querySelector('.sug-title') ||
          coverEl.parentElement.querySelector('.radar-title') ||
          coverEl.parentElement.querySelector('.hist-title') ||
          coverEl.parentElement.querySelector('.app-book-title');
      }

      if (!titleEl) return;

      const title = titleEl.textContent.trim();
      const isbn = BOOK_COVERS[title];
      if (!isbn) return;

      injectCover(coverEl, isbn, title);
    });
  });
}

function injectCover(el, isbn, title) {
  const imgUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

  const img = document.createElement('img');
  img.src = imgUrl;
  img.alt = title;
  img.style.cssText = [
    'position:absolute', 'inset:0',
    'width:100%', 'height:100%',
    'object-fit:cover', 'object-position:center top',
    'z-index:0', 'opacity:0',
    'transition:opacity 0.35s ease',
    'border-radius:inherit',
  ].join(';');

  img.onload = () => {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    img.style.opacity = '1';

    // Gradient overlay for text readability
    if (!el.querySelector('.bb-gradient')) {
      const grad = document.createElement('div');
      grad.className = 'bb-gradient';
      grad.style.cssText = [
        'position:absolute', 'inset:0',
        'background:linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.05) 100%)',
        'z-index:1', 'pointer-events:none',
      ].join(';');
      el.appendChild(grad);
    }

    // Lift all existing child elements above the gradient
    Array.from(el.children).forEach(child => {
      if (child !== img && !child.classList.contains('bb-gradient')) {
        child.style.position = 'relative';
        child.style.zIndex = '2';
        child.style.color = '#F5F0E8';
        child.style.textShadow = '0 1px 4px rgba(0,0,0,0.7)';
      }
    });
  };

  img.onerror = () => img.remove(); // fallback to existing color bg

  el.insertBefore(img, el.firstChild);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadBookCovers);
} else {
  loadBookCovers();
}
