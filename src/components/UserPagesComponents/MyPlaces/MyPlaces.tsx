import { useContext, useEffect, useState } from "react";
import * as placeService from "../../../services/placeService.js";
import formStyles from "../../../common/styles/Forms.module.scss";
import stylesUserDashboard from "../../../common/styles/Dashboard.module.scss";
import styles from "../../../common/styles/UserItems.module.scss";
import { IPlace } from "../../../common/types/placeTypes/placeTypes.js";
import { useNavigate } from "react-router-dom";
import UserContext from "../../Contexts/UserContext/UserContext.js";
import { checkPermission } from "../../../common/functions/checkPermission.js";
import { UserType } from "../../../common/types/userTypes/userTypes.js";
import { Helmet } from "react-helmet";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IMessageValues } from "../../../common/types/commonTypes.ts/commonTypes.js";

function MyPlaces(props: { messageSetter: React.Dispatch<IMessageValues> }) {
  // Setting states
  // Array of user owned places meant to be displayed, edited or deleted
  const [userPlacesList, setUserPlacesList] = useState<IPlace[]>([]);

  // Fetching the user's current data
  const userContextValue = useContext(UserContext);

  const navigate = useNavigate();

  // When the user's access token is reset, pull the values anew if possible
  useEffect(() => {
    getUserPlaces();
  }, [userContextValue]);

  async function getUserPlaces() {
    try {
      if (checkPermission(userContextValue.status, UserType.User)) {
        const userPlaces = await placeService.fetchUserPlaces();
        setUserPlacesList(userPlaces.data);
      }
    } catch (err) {
      props.messageSetter({
        message: "An error has occured and we could get your places.",
        successStatus: false,
      });
    }
  }

  // Requires user confirmation upon deleting one of their places
  async function handleUserPlaceDeleted(placeId: string) {
    try {
      if (confirm("Are you sure you want to delete this place?")) {
        if (checkPermission(userContextValue.status, UserType.User)) {
          await placeService.deletePlaceById(placeId);
          getUserPlaces();
          props.messageSetter({
            message: "The place has been successfully deleted",
            successStatus: true,
          });
        }
      }
    } catch (err) {
      props.messageSetter({
        message: "An error has occured and we could not delete the place",
        successStatus: false,
      });
    }
  }

  return (
    <>
      <Helmet>
        <title>My places</title>
        <link
          rel="canonical"
          href="https://marketplates.netlify.app/myplaces"
        />
      </Helmet>
      <section id={styles.itemContainer}>
        <h1>Manage your places</h1>
        <article className={formStyles.finalButtonContainer}>
          {userPlacesList.length > 0 ? (
            <button
              onClick={() => {
                navigate("/createplace");
              }}
            >
              Register a place
            </button>
          ) : (
            <>
              <h2>No place here yet?</h2>
              <button
                onClick={() => {
                  navigate("/createplace");
                }}
              >
                Register your first place
              </button>
            </>
          )}
        </article>

        <div id={styles.itemListContainer}>
          {userPlacesList &&
            userPlacesList.map((place) => (
              <section className={styles.userItemContainer} key={place.name}>
                <article className={styles.itemDataContainer}>
                  <h2>{place.name}</h2>
                  <ul>
                    <li className={styles.itemDataField}>Description</li>
                    <li>{place.description}</li>
                    <li className={styles.itemDataField}>Address</li>
                    <li>{place.address}</li>
                  </ul>
                </article>
                <article className={styles.itemButtonContainer}>
                  <button
                    type="button"
                    onClick={() => navigate(`/editplace/${place._id}`)}
                  >
                    <FontAwesomeIcon icon={solid("pen-to-square")} />
                    Edit place
                  </button>
                  <span className={stylesUserDashboard.deleteButton}>
                    <button
                      type="button"
                      onClick={() => {
                        place._id
                          ? handleUserPlaceDeleted(place._id)
                          : props.messageSetter({
                              message: "This place was already deleted",
                              successStatus: false,
                            });
                      }}
                    >
                      <FontAwesomeIcon icon={solid("trash-can")} />
                      Delete place
                    </button>
                  </span>
                </article>
              </section>
            ))}
        </div>
      </section>
    </>
  );
}

export default MyPlaces;
