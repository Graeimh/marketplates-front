import { useContext, useEffect, useState } from "react";
import * as tagService from "../../../services/tagService.js";
import formStyles from "../../../common/styles/Forms.module.scss";
import itemStyles from "../../../common/styles/ManipulationItem.module.scss";
import stylesUserDashboard from "../../../common/styles/Dashboard.module.scss";
import styles from "./TagManipulationItem.module.scss";
import { ITag, ITagValues } from "../../../common/types/tagTypes/tagTypes.js";
import { HexColorPicker } from "react-colorful";
import { hexifyColors } from "../../../common/functions/hexifyColors.js";
import Tag from "../../MapGenerationComponents/Tag/index.js";
import { checkPermission } from "../../../common/functions/checkPermission.js";
import { UserType } from "../../../common/types/userTypes/userTypes.js";
import UserContext from "../../Contexts/UserContext/UserContext.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { regular, solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import { IMessageValues } from "../../../common/types/commonTypes.ts/commonTypes.js";

function TagManipulationItem(props: {
  tag: ITag;
  uponDeletion: (tagId: string) => void;
  primeForDeletion: (tagId: string) => void;
  IsSelected: boolean;
  refetch: () => Promise<void>;
  messageSetter: React.Dispatch<IMessageValues>;
}) {
  const [formData, setFormData] = useState<ITagValues>({
    tagBackgroundColor: props.tag.backgroundColor,
    tagName: props.tag.name,
    tagNameColor: props.tag.nameColor,
  });

  // Tracks whether or not this tag is selected for group deletion
  const [isPrimed, setIsPrimed] = useState(false);

  // Tracks the data sent to be back end is correct or not
  const [validForUpdating, setValidForUpdating] = useState(false);

  // Fetching the user's current data
  const userContextValue = useContext(UserContext);

  // Contains the current values of the tag's color
  const style = {
    color: props.tag.nameColor,
    backgroundColor: props.tag.backgroundColor,
  };

  // Contains the updated values of the tag's color
  const updatedStyle = {
    color: formData.tagNameColor,
    backgroundColor: formData.tagBackgroundColor,
  };

  // Regex for hex color validation
  const hexColorPattern = /^#[A-Fa-f0-9]{6}$/;

  // Each time an input is modified we check if the form is valid for sending
  useEffect(() => {
    decideUpdatability();
  }, [formData]);

  // Data validation made to match the back end specifications
  function decideUpdatability() {
    setValidForUpdating(
      formData.tagName.length > 3 &&
        (formData.tagName !== props.tag.name ||
          formData.tagNameColor !== props.tag.nameColor ||
          formData.tagBackgroundColor !== props.tag.backgroundColor) &&
        hexColorPattern.test(formData.tagBackgroundColor) &&
        hexColorPattern.test(formData.tagNameColor)
    );
  }

  // When the button is clicked, the tag is either added or removed from the list of tags to be group-deleted
  function handleDeletePrimer() {
    props.primeForDeletion(props.tag._id);
    setIsPrimed(!isPrimed);
  }

  function updateField(event) {
    //hexifyColors ensures the colors keep a "#aaaaaa" format
    switch (event.target.name) {
      case "tagNameColor":
        setFormData({
          ...formData,
          tagNameColor: hexifyColors(event.target.userContextValue.toString()),
        });
        break;
      case "tagBackgroundColor":
        setFormData({
          ...formData,
          tagBackgroundColor: hexifyColors(
            event.target.userContextValue.toString()
          ),
        });
        break;
      default:
        setFormData({
          ...formData,
          [event.target.name]: event.target.value,
        });
    }
  }

  // The admin can also manually delete the tag from a button
  function handleDelete() {
    props.uponDeletion(props.tag._id);
  }

  // Sending data to the back end
  async function sendUpdateForm(event) {
    event.preventDefault();
    if (
      checkPermission(userContextValue.status, UserType.Admin) &&
      validForUpdating
    ) {
      try {
        await tagService.updateTagById(props.tag._id, formData);
        setValidForUpdating(false);
        props.messageSetter({
          message: "Tag updated successfully.",
          successStatus: true,
        });
        props.refetch();
      } catch (err) {
        props.messageSetter({
          message: "We could not update the tag.",
          successStatus: false,
        });
      }
    } else {
      props.messageSetter({
        message: "The tag data is not valid or you do not have permission.",
        successStatus: false,
      });
    }
  }

  return (
    <>
      <section
        className={`
          ${
            props.IsSelected
              ? itemStyles.primedContainer
              : itemStyles.itemContainer
          } ${formStyles.formContainer}
            `}
      >
        <h2 className={formStyles.itemTitle}>Tag :</h2>
        <Tag customStyle={style} tagName={props.tag.name} isTiny={false} />
        <div>
          <button
            type="button"
            className={props.IsSelected ? itemStyles.primedButton : ""}
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
              <FontAwesomeIcon icon={solid("tag")} />
              <FontAwesomeIcon icon={solid("xmark")} /> Delete tag
            </button>
          </span>
        </div>
        <form onSubmit={sendUpdateForm}>
          <fieldset>
            <label htmlFor={`tagName${props.tag._id}`}>Tag name : </label>
            <input
              type="text"
              name="tagName"
              id={`tagName${props.tag._id}`}
              onInput={updateField}
              value={formData.tagName}
            />
            <div className={styles.specificDataTagList}>
              <ul className={styles.tagEditor}>
                <li className={styles.centeredTagEditorElement}>
                  <div>
                    <HexColorPicker
                      color={formData.tagBackgroundColor}
                      onChange={(e) =>
                        setFormData({ ...formData, tagBackgroundColor: e })
                      }
                      style={{ margin: "auto" }}
                    />
                  </div>
                  <label htmlFor={`tagBackgroundColor${props.tag._id}`}>
                    Background Color :{" "}
                  </label>
                  <input
                    type="text"
                    name="tagBackgroundColor"
                    id={`tagBackgroundColor${props.tag._id}`}
                    onInput={updateField}
                    value={formData.tagBackgroundColor}
                  />
                </li>
                <li className={styles.centeredTagEditorElement}>
                  <HexColorPicker
                    color={formData.tagNameColor}
                    onChange={(e) =>
                      setFormData({ ...formData, tagNameColor: e })
                    }
                    style={{ margin: "auto" }}
                  />
                  <label htmlFor={`tagNameColor${props.tag._id}`}>
                    Name Color :{" "}
                  </label>
                  <input
                    type="text"
                    name="tagNameColor"
                    id={`tagNameColor${props.tag._id}`}
                    onInput={updateField}
                    value={formData.tagNameColor}
                  />
                </li>
              </ul>
            </div>
          </fieldset>
          <div>
            <ul>
              <li className={styles.centeredTagEditorElement}>
                Before changes :
                <Tag
                  customStyle={style}
                  tagName={props.tag.name}
                  isTiny={false}
                />
              </li>
              {(formData.tagName !== props.tag.name ||
                formData.tagBackgroundColor !== props.tag.backgroundColor ||
                formData.tagNameColor !== props.tag.nameColor) && (
                <>
                  <li className={styles.centeredTagEditorElement}>
                    After changes :
                    <Tag
                      customStyle={updatedStyle}
                      tagName={formData.tagName}
                      isTiny={false}
                    />
                  </li>
                </>
              )}
            </ul>
          </div>
          <div className={formStyles.finalButtonContainer}>
            <button type="submit" disabled={!validForUpdating}>
              Update tag
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export default TagManipulationItem;
