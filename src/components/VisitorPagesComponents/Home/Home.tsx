import { Helmet } from "react-helmet";
import styles from "./Home.module.scss";
import { useContext } from "react";
import UserContext from "../../Contexts/UserContext";
import { Link } from "react-router-dom";
import pot from "../../../assets/pot.svg";
import spoon from "../../../assets/spoon.svg";

function Home() {
  // Fetching the user's current data
  const userContextValue = useContext(UserContext);

  return (
    <>
      <Helmet>
        <title>Marketplates</title>
        <link rel="canonical" href="http://localhost:5173" />
      </Helmet>
      <section id={styles.homeContainer}>
        <h1>What's new in the pot?</h1>
        <div id={styles.homeDisposition}>
          <article className={styles.homeSections}>
            <h2>We just launched!</h2>
            <p>
              Welcome aboard everyone, Marketplates is officially online... for
              now!
            </p>
          </article>
          {userContextValue.userId.length > 0 ? (
            <article className={styles.homeSections}>
              <h2>Since you are already here, try our new features out!</h2>
            </article>
          ) : (
            <article className={styles.homeSections}>
              <h2>Not around the table already?</h2>
              <p>
                Consider <Link to="/login">logging in</Link> or{" "}
                <Link to="/register">registering</Link>
              </p>
            </article>
          )}
        </div>
      </section>
      <span id={styles.spoonWrapper}>
        <img src={spoon} alt="Spoon" id={styles.spoon} />
      </span>
      <img src={pot} alt="Pot" id={styles.pot} />
    </>
  );
}

export default Home;
