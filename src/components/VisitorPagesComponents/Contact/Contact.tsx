import { Helmet } from "react-helmet";
import iconStyles from "../../../common/styles/Icons.module.scss";
import styles from "./Contact.module.scss";

function Contact() {
  return (
    <>
      <Helmet>
        <title>Contact</title>
        <link rel="canonical" href="https://marketplates.netlify.app/contact" />
      </Helmet>
      <section id={styles.contactContainer}>
        <h1>Contact</h1>
        <h2>Keep the pot boiling!</h2>
        <div id={styles.contactDisposition}>
          <article className={styles.contactSections}>
            <h3>Give us feedback</h3>
            <p>
              If you find a bug of any kind, want to suggest a feature or report
              a bug please send a mail to the following email address.
              <span className={iconStyles.iconTitle}>
                <a
                  href="mailto:marketplatesowner@gmail.com"
                  aria-label="Send mail to marketplatesowner@gmail.com"
                >
                  Send us some love!
                </a>
              </span>
            </p>
          </article>

          <article className={styles.contactSections}>
            <h3>Legal mentions</h3>
            <p>
              This website has been developped by Quentin Guinier, 23 Rue Jean
              Jaurès, Lesquin, you can email me at the email address specified
              above.
            </p>
            <p>
              Our map system is made using{" "}
              <a href="https://react-leaflet.js.org/">React Leaflet</a>. We are
              hosted by ...
            </p>
          </article>
        </div>
      </section>
    </>
  );
}

export default Contact;
