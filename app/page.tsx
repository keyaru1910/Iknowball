import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";

const navItems = ["Home", "Lịch thi đấu", "Dự đoán (Tips)", "Bảng xếp hạng", "Đăng nhập/Đăng ký"];

const categories = [
  { name: "FOOTBALL", crop: "28% 31%" },
  { name: "BASKET BALL", crop: "43% 30%" },
  { name: "CAR SPORT", crop: "58% 33%" },
  { name: "TABLE TENNIS", crop: "77% 31%" },
];

const trending = [
  "Man City win probability rises after early pressure",
  "Lakers protect narrow lead in final quarter",
  "T1 and Gen.G enter decisive map tonight",
];

const articles = [
  {
    tag: "Basketball",
    title: "5 Exercises Basketball Players Should Be Using To Develop Strength",
    crop: "26% 73%",
  },
  {
    tag: "Football",
    title: "Golden Knights out to fulfill owner's quest to win Stanley Cup in 6th year",
    crop: "50% 72%",
  },
  {
    tag: "Badminton",
    title: "Outdoor Badminton Gets Support From Local Federation",
    crop: "74% 72%",
  },
];

export default function Home() {
  return (
    <main className="news-page">
      <header className="topbar">
        <a className="script-logo" href="#">
          IKnowBall
        </a>
        <nav aria-label="Main navigation">
          {navItems.map((item) => (
            <a key={item} href="#">
              {item}
            </a>
          ))}
        </nav>
      </header>

      <section className="home-hero">
        <Image
          src="/background.jpg"
          alt="Argentina players celebrating with the World Cup trophy"
          fill
          priority
          sizes="100vw"
          className="home-hero-image"
        />
        <div className="home-hero-content">
          <h1>
            PREDICT THE
            <br />
            CHAMPIONS
          </h1>
          <a href="#" className="hero-cta">
            PREDICT NOW
          </a>
        </div>
      </section>

      <section className="category-section">
        <h2>Category</h2>
        <div className="category-grid">
          {categories.map((category, index) => (
            <article className="category-card" key={category.name}>
              {index % 2 === 0 ? (
                <>
                  <div className="category-label">{category.name}</div>
                  <ImageTile crop={category.crop} />
                </>
              ) : (
                <>
                  <ImageTile crop={category.crop} />
                  <div className="category-label">{category.name}</div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="feature-row">
        <article className="trending-panel">
          <h2>Trending News</h2>
          {trending.map((item, index) => (
            <div className="trend-item" key={item}>
              <ImageTile crop={`${24 + index * 8}% ${43 + index * 5}%`} />
              <div>
                <small>Race{98 + index} - 03 June 2026</small>
                <h3>{item}</h3>
                <p>AI probability changed after recent match events and team form updates.</p>
              </div>
            </div>
          ))}
        </article>

        <article className="large-story">
          <Image
            src="/design/landing-page.png"
            alt="Cycling feature story"
            fill
            sizes="50vw"
            className="crop-image cycling-crop"
          />
          <div className="story-overlay">
            <span>Cycling</span>
            <small>Debits - 03 June 2026</small>
            <h2>DISCOVER THE MEMBER BENEFITS OF USA CYCLING!</h2>
          </div>
        </article>
      </section>

      <section className="headline-slider">
        <Image
          src="/design/landing-page.png"
          alt="Football headline story"
          fill
          sizes="100vw"
          className="crop-image football-crop"
        />
        <div className="headline-content">
          <span>Football</span>
          <small>Agence France-Presse - 04 June 2026</small>
          <h2>LIONEL MESSI LEAVING LIGUE 1 TEAM PARIS SAINT-GERMAIN, CLUB CONFIRMS</h2>
          <p>The EuroLeague Finals Top Scorer is the individual award for the player that gained the highest points.</p>
        </div>
      </section>

      <div className="pager">
        <button aria-label="Previous slide">
          <ArrowLeft size={18} />
        </button>
        <span className="active-page">1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <button aria-label="Next slide">
          <ArrowRight size={18} />
        </button>
      </div>

      <section className="info-row">
        <article className="recent-news">
          <h2>Recent News</h2>
          <div className="recent-grid">
            <div className="recent-main">
              <ImageTile crop="24% 63%" />
              <p>Baku 2023 World Taekwondo Championships</p>
            </div>
            <div className="recent-list">
              {["Baku 2023 Taekwondo Championship", "Open Championship Royal Liverpool Golf", "Ireland Tour of England Test 2023"].map(
                (item) => (
                  <p key={item}>{item}</p>
                ),
              )}
              <button>More +</button>
            </div>
          </div>
        </article>

        <article className="ranking-table">
          <h2>Clubs Ranking</h2>
          <table>
            <thead>
              <tr>
                <th>Club</th>
                <th>GP</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GD</th>
              </tr>
            </thead>
            <tbody>
              {["Manchester City", "Liverpool", "Chelsea", "Tottenham Hotspur", "Arsenal", "Manchester United"].map(
                (club, index) => (
                  <tr key={club}>
                    <td>{index + 1}. {club}</td>
                    <td>38</td>
                    <td>{29 - index * 2}</td>
                    <td>{6 + index}</td>
                    <td>{3 + index}</td>
                    <td>{73 - index * 9}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </article>
      </section>

      <section className="article-section">
        <h2>Sports Article</h2>
        <div className="article-grid">
          {articles.map((article) => (
            <article className="article-card" key={article.title}>
              <div className="article-image">
                <Image
                  src="/design/landing-page.png"
                  alt=""
                  fill
                  sizes="33vw"
                  className="crop-image"
                  style={{ objectPosition: article.crop }}
                />
                <span>{article.tag}</span>
              </div>
              <small>03 June 2026</small>
              <h3>{article.title}</h3>
              <p>
                This article highlights the kind of sports insight Iknowball can later connect with prediction data.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="newsletter-band">
        <div>
          <h2>
            NEWSLETTER
            <br />
            SUBSCRIPTION
          </h2>
          <form>
            <input aria-label="Email" placeholder="shovon.khan0099@gmail.com" />
            <button aria-label="Subscribe">
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
        <div className="newsletter-player">
          <Image
            src="/design/Newsletter.png"
            alt=""
            fill
            sizes="35vw"
            className="crop-image newsletter-crop"
          />
        </div>
      </section>
    </main>
  );
}

function SmallNewsCard({ crop, title }: { crop: string; title: string }) {
  return (
    <article className="small-news-card">
      <Image
        src="/design/Newsletter.png"
        alt=""
        fill
        sizes="180px"
        className="crop-image"
        style={{ objectPosition: crop }}
      />
      <div>
        <small>Race98 - 03 June 2026</small>
        <h3>{title}</h3>
      </div>
    </article>
  );
}

function ImageTile({ crop }: { crop: string }) {
  return (
    <div className="image-tile">
      {/* The source is the supplied design screenshot; object-position crops reusable sports visuals from it. */}
      <Image
        src="/design/landing-page.png"
        alt=""
        fill
        sizes="220px"
        className="crop-image"
        style={{ objectPosition: crop }}
      />
    </div>
  );
}
