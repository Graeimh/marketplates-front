import { useContext, useEffect, useState } from "react";
import * as userService from "../../../services/userService.js";
import formStyles from "../../../common/styles/Forms.module.scss";
import stylesUserDashboard from "../../../common/styles/Dashboard.module.scss";
import styles from "../../../common/styles/ManipulationItem.module.scss";
import {
  IUser,
  IUserData,
  UserType,
} from "../../../common/types/userTypes/userTypes.js";
import { checkPermission } from "../../../common/functions/checkPermission.js";
import UserContext from "../../Contexts/UserContext/UserContext.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { regular, solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import { IMessageValues } from "../../../common/types/commonTypes.ts/commonTypes.js";

function UserManipulationItem(props: {
  user: IUser;
  uponDeletion: (userId: string) => void;
  primeForDeletion: (userId: string) => void;
  IsSelected: boolean;
  refetch: () => Promise<void>;
  messageSetter: React.Dispatch<IMessageValues>;
}) {
  // Setting states
  // Data to be sent to back end
  const [formData, setFormData] = useState<IUserData>({
    displayName: props.user.displayName,
    email: props.user.email,
    firstName: props.user.firstName,
    lastName: props.user.lastName,
    city: props.user.location.city,
    country: props.user.location.city,
    county: props.user.location.county,
    streetAddress: props.user.location.streetAddress,
  });

  // Tracks whether or not this user is selected for group deletion
  const [isPrimed, setIsPrimed] = useState(false);

  // Tracks the data sent to be back end is correct or not
  const [validForUpdating, setValidForUpdating] = useState(false);

  // Fetching the user's current data
  const userContextValue = useContext(UserContext);

  // Regex for email validation
  const emailPattern =
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

  // Each time an input is modified we check if the form is valid for sending
  useEffect(() => {
    decideUpdatability();
  }, [formData]);

  function decideUpdatability() {
    setValidForUpdating(
      formData.displayName.length > 1 &&
        formData.email.length > 1 &&
        formData.firstName.length > 1 &&
        formData.lastName.length > 1 &&
        formData.streetAddress.length > 1 &&
        formData.county.length > 1 &&
        formData.city.length > 1 &&
        formData.country.length > 1 &&
        (formData.displayName !== props.user.displayName ||
          formData.email !== props.user.email ||
          formData.firstName !== props.user.firstName ||
          formData.lastName !== props.user.lastName ||
          formData.streetAddress !== props.user.location.streetAddress ||
          formData.county !== props.user.location.county ||
          formData.city !== props.user.location.city ||
          formData.country !== props.user.location.country) &&
        emailPattern.test(formData.email)
    );
  }

  function updateField(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }
  // When the button is clicked, the user is either added or removed from the list of users to be group-deleted
  function handleDeletePrimer() {
    props.primeForDeletion(props.user._id);
    setIsPrimed(!isPrimed);
  }

  // Sending data to the back end
  async function sendUpdateForm(event) {
    event.preventDefault();

    try {
      if (
        checkPermission(userContextValue.status, UserType.Admin) &&
        validForUpdating
      ) {
        await userService.updateUserById(props.user._id, formData);
        props.messageSetter({
          message: "User updated successfully",
          successStatus: true,
        });
        props.refetch();
        setValidForUpdating(false);
      }
    } catch (err) {
      props.messageSetter({
        message: "We could not update the user's information",
        successStatus: false,
      });
    }
  }

  // The admin can also manually delete the user from a button
  function handleDelete() {
    props.uponDeletion(props.user._id);
  }

  return (
    <>
      <section
        className={`
          ${props.IsSelected ? styles.primedContainer : styles.itemContainer} ${
          formStyles.formContainer
        }
            `}
      >
        <h2 className={formStyles.itemTitle}>
          User : {props.user.displayName}
        </h2>
        <div className={formStyles.managementItemButtoms}>
          <button
            type="button"
            className={props.IsSelected ? styles.primedButton : ""}
            onClick={() => handleDeletePrimer()}
          >
            {props.IsSelected ? (
              <FontAwesomeIcon icon={regular("trash-can")} />
            ) : (
              <FontAwesomeIcon icon={solid("trash-can-arrow-up")} />
            )}
            {props.IsSelected ? " Cancel selection" : " Select"}
          </button>
          <span className={stylesUserDashboard.deleteButton}>
            <button type="button" onClick={handleDelete}>
              <FontAwesomeIcon icon={solid("user-slash")} /> Delete user
            </button>
          </span>
        </div>
        <form onSubmit={sendUpdateForm}>
          <fieldset className={formStyles.specificData}>
            <legend>Personnal information</legend>

            <label htmlFor={`firstName${props.user._id}`}>First name : </label>
            <input
              type="text"
              name="firstName"
              id={`firstName${props.user._id}`}
              onInput={updateField}
              value={formData.firstName}
            />
            <label htmlFor={`lastName${props.user._id}`}>Last name : </label>
            <input
              type="text"
              name="lastName"
              id={`lastName${props.user._id}`}
              onInput={updateField}
              value={formData.lastName}
            />
            <div>
              <label htmlFor={`streetAddress${props.user._id}`}>
                Street address :{" "}
              </label>
              <input
                type="text"
                name="streetAddress"
                id={`streetAddress${props.user._id}`}
                onInput={updateField}
                value={formData.streetAddress}
              />
            </div>
            <label htmlFor={`county${props.user._id}`}>County : </label>
            <input
              type="text"
              name="county"
              id={`county${props.user._id}`}
              onInput={updateField}
              value={formData.county}
            />
            <label htmlFor={`city${props.user._id}`}>City : </label>
            <input
              type="text"
              name="city"
              id={`city${props.user._id}`}
              onInput={updateField}
              value={formData.city}
            />
            <label htmlFor={`country${props.user._id}`}>Country : </label>
            <input
              type="text"
              name="country"
              id={`country${props.user._id}`}
              onInput={updateField}
              value={formData.country}
            />
          </fieldset>
          <fieldset>
            <legend>Credentials</legend>
            <label htmlFor={`displayName${props.user._id}`}>Nickname : </label>
            <input
              type="text"
              name="displayName"
              id={`displayName${props.user._id}`}
              onInput={updateField}
              value={formData.displayName}
            />
            <label htmlFor={`email${props.user._id}`}>Email : </label>
            <input
              type="email"
              name="email"
              id={`email${props.user._id}`}
              onInput={updateField}
              value={formData.email}
            />
          </fieldset>
          <div className={formStyles.finalButtonContainer}>
            <button
              type="submit"
              disabled={
                !validForUpdating || userContextValue.email === props.user.email
              }
            >
              Update User
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export default UserManipulationItem;
