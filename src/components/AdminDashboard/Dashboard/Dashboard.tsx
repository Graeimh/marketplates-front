import { Link } from "react-router-dom";
import styles from "../../../common/styles/Dashboard.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import { Helmet } from "react-helmet";

function Dashboard() {
  return (
    <>
      <Helmet>
        <title>Dashboard</title>
        <link
          rel="canonical"
          href="https://marketplates.netlify.app/dashboard"
        />
      </Helmet>
      <nav id={styles.dashboardPanel}>
        <Link to="/dashboard/users">
          <span className={styles.dashboardOptionChevron}>
            <FontAwesomeIcon icon={solid("chevron-right")} />
          </span>
          <span className={styles.dashboardOptionText}>Manage users</span>
          <span className={styles.dashboardOptionDecorator}>
            <FontAwesomeIcon icon={solid("users")} />
          </span>
        </Link>
        <Link to="/dashboard/tags">
          <span className={styles.dashboardOptionChevron}>
            <FontAwesomeIcon icon={solid("chevron-right")} />
          </span>
          <span className={styles.dashboardOptionText}>Manage tags</span>
          <span className={styles.dashboardOptionDecorator}>
            <FontAwesomeIcon icon={solid("tags")} />
          </span>
        </Link>
        <Link to="/dashboard/places">
          <span className={styles.dashboardOptionChevron}>
            <FontAwesomeIcon icon={solid("chevron-right")} />
          </span>
          <span className={styles.dashboardOptionText}>Manage places</span>
          <span className={styles.dashboardOptionDecorator}>
            <FontAwesomeIcon icon={solid("shop")} />
          </span>
        </Link>
      </nav>
    </>
  );
}

export default Dashboard;
