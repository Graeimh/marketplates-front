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
              Conformément aux dispositions de la loi n° 2004-575 du 21 juin
              2004 pour la confiance en l'économie numérique, il est précisé aux
              utilisateurs du site Marketplates l'identité des différents
              intervenants dans le cadre de sa réalisation et de son suivi.
            </p>
            <h4>Edition du site</h4>
            <p>
              Le présent site, accessible à l"URL
              <a href="https://marketplates.netlify.app/">
                https://marketplates.netlify.app/
              </a>
              (le « Site »), est édité par : Quentin Guinier, résidant 23 rue
              Jean Jaurès, de nationalité Française (France), né(e) le
              11/07/1996.
            </p>
            <h4>Hébergement</h4>
            <p>
              Le Site est hébergé par la société Netlify, situé 512 2nd Street,
              Suite 200 San Francisco, CA 94107, (contact téléphonique ou email
              : +14156911573).
            </p>
            <h4>Directeur de publication</h4>
            <p>Le Directeur de la publication du Site est Quentin Guinier.</p>
            <h4>Nous contacter</h4>
            <ul>
              <li>Par téléphone: +33620975571</li>
              <li>
                Par email:{" "}
                <a
                  href="mailto:marketplatesowner@gmail.com"
                  aria-label="Send mail to marketplatesowner@gmail.com"
                >
                  marketplatesowner@gmail.com
                </a>
              </li>
              <li>Par courrier: 23 rue Jean Jaurès 59810 Lesquin</li>
            </ul>
            <h4>Données personnelles</h4>
            <p>
              Le traitement de vos données à caractère personnel est régi par
              notre Charte du respect de la vie privée, disponible depuis la
              section "Charte de Protection des Données Personnelles",
              conformément au Règlement Général sur la Protection des Données
              2016/679 du 27 avril 2016 («RGPD»).
            </p>
          </article>
        </div>
      </section>
    </>
  );
}

export default Contact;
