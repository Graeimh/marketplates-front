import { useContext, useEffect, useState } from "react";
import formStyles from "../../../common/styles/Forms.module.scss";
import iconStyles from "../../../common/styles/Icons.module.scss";
import styles from "./MapEditor.module.scss";
import * as mapService from "../../../services/mapService.js";
import * as placeIterationService from "../../../services/placeIterationService.js";
import * as placeService from "../../../services/placeService.js";
import * as tagService from "../../../services/tagService.js";
import { useNavigate } from "react-router-dom";
import { ITag } from "../../../common/types/tagTypes/tagTypes.js";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Tag from "../Tag/Tag.js";
import MapValuesManager from "../MapValuesManager/MapValuesManager.js";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { SearchResult } from "leaflet-geosearch/dist/providers/provider.js";
import { RawResult } from "leaflet-geosearch/dist/providers/openStreetMapProvider.js";
import {
  IMarkersForMap,
  IPlace,
  IPlaceFilterQuery,
  IPlaceIteration,
  IPlaceUpdated,
  ITagFilterQuery,
} from "../../../common/types/placeTypes/placeTypes.js";
import {
  IMapValues,
  PrivacyStatus,
} from "../../../common/types/mapTypes/mapTypes.js";
import {
  IGPSCoordinates,
  IMessageValues,
} from "../../../common/types/commonTypes.ts/commonTypes.js";
import { checkPermission } from "../../../common/functions/checkPermission.js";
import { UserType } from "../../../common/types/userTypes/userTypes.js";
import UserContext from "../../Contexts/UserContext/UserContext.js";
import { Helmet } from "react-helmet";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icon } from "leaflet";
import marker from "../../../assets/marker.png";

function MapEditor(props: {
  editedMap: string | undefined;
  messageSetter: React.Dispatch<IMessageValues>;
}) {
  // Setting states
  // Contains the data needed to create a map
  const [formData, setFormData] = useState<IMapValues>({
    name: "MyMap",
    description: "My map's description",
    privacyStatus: PrivacyStatus.Public,
    participants: [],
    placeIterations: [],
  });

  // Contains all the tags available for the user pulled from the database
  const [tagList, setTagList] = useState<ITag[]>([]);

  // Contains the tags remaining post filtering
  const [tagFilterList, setTagFilterList] = useState<ITag[]>([]);

  //
  const [newResults, setNewResults] = useState<SearchResult<RawResult>[]>([]);
  const [coordinates, setCoordinates] = useState<IGPSCoordinates>({
    longitude: 3.066667,
    latitude: 50.633333,
  });

  // Contains all the places available for all maps
  const [placeList, setPlaceList] = useState<IPlace[]>([]);

  // Contains the address' value to be used with the OpenStreetMapProvider
  const [addressQuery, setAddressQuery] = useState<string>("");

  // Checks if the values for the map's data fit a criteria before allowing its creation or editing
  const [isValidForSending, setIsValidForSending] = useState<boolean>(false);

  // Checks if the values for the place iterations's data fit a criteria before allowing its creation or editing
  const [isValidPlaceIterationForSending, setIsValidPlaceIterationForSending] =
    useState<boolean>(false);

  // Contains the values used to create an iteration for the map itself before being sent to backend alongside with it
  const [iterationValues, setIterationValues] = useState<IPlaceUpdated>({
    address: "",
    description: "",
    gpsCoordinates: {
      longitude: null,
      latitude: null,
    },
    _id: "",
    name: "",
    tagsIdList: [],
    tagsList: [],
  });

  // Contains all the iterations already present or created for the map
  const [iterationsList, setIterationsList] = useState<IPlaceUpdated[]>([]);

  // Contains the values used to filter places and iterations, either via name, or via tags which can be filtered using tagName
  const [placeFilterQuery, setPlaceFilterQuery] = useState<IPlaceFilterQuery>({
    filterNameQuery: "",
    filterTagQuery: "",
    tags: [],
  });

  // Contains the values used to filter iterations via name mostly for now
  const [iterationTagFilterQuery, setIterationTagFilterQuery] =
    useState<ITagFilterQuery>({
      tagName: "",
    });

  const [mapDataCollapseVisible, setMapDataCollapseVisible] = useState(false);
  const [addressCollapseVisible, setAddressCollapseVisible] = useState(false);
  const [filtersCollapseVisible, setFiltersCollapseVisible] = useState(false);
  const [iterationCollapseVisible, setIterationCollapseVisible] =
    useState(false);

  // Fetching the user's current data
  const userContextValue = useContext(UserContext);
  const navigate = useNavigate();

  // Allows to fetch the value of a marker's image
  const mapMarkerIcon = icon({
    iconUrl: marker,
    iconSize: [32, 32],
    iconAnchor: [20, 32],
  });

  // Allows to interact with a map address search api
  const provider = new OpenStreetMapProvider();

  const mapmarkers: IPlaceUpdated[] = [];
  for (const place of placeList) {
    const marker: IPlaceUpdated = {
      ...place,
      tagsIdList: place.tagsList,
      tagsList: [...tagList].filter((tag) => place.tagsList.includes(tag._id)),
    };
    mapmarkers.push(marker);
  }

  // Places are replaced with iterations if their ids or place ids match
  const mapMarkersAndIterations: IMarkersForMap[] = [];
  for (const marker of mapmarkers) {
    const iterationToList = iterationsList.find(
      (iteration) =>
        iteration._id === marker._id || iteration.place_id === marker._id
    );
    if (iterationToList) {
      const iteration = { ...iterationToList, isIteration: true };
      mapMarkersAndIterations.push(iteration);
    } else {
      const regularMarker = { ...marker, isIteration: false };
      mapMarkersAndIterations.push(regularMarker);
    }
  }

  // A smaller selection of tags to avoid overcrowding the user's page
  const tagSelection: ITag[] = [...tagFilterList].slice(0, 10);

  // Once a tag is bound to an iteration it is no longer within the available tags
  const tagListWithoutSelected: ITag[] = [
    ...new Set(
      tagFilterList.filter(
        (tag) =>
          !placeFilterQuery.tags
            .map((formDataTag) => formDataTag._id)
            .includes(tag._id)
      )
    ),
  ];

  const tagListForIterationWithoutSelected: ITag[] = [
    ...new Set(
      tagFilterList.filter(
        (tag) => !iterationValues.tagsIdList.includes(tag._id)
      )
    ),
  ];

  // Tags are also filtered through user input if they are looking for specific tags
  const tagListWithoutSelectedAndFiltered: ITag[] = [
    ...tagListWithoutSelected,
  ].filter((tag) =>
    new RegExp(placeFilterQuery.filterTagQuery, "i").test(tag.name)
  );

  const tagListToDisplay: ITag[] =
    placeFilterQuery.filterTagQuery.length > 0
      ? tagListWithoutSelectedAndFiltered
      : tagSelection;

  // The same process goes for the tags list involved when creating or editing an iteration
  const tagListForIterationWithoutSelectedAndFiltered: ITag[] = [
    ...tagListForIterationWithoutSelected,
  ].filter((tag) =>
    new RegExp(iterationTagFilterQuery.tagName, "i").test(tag.name)
  );

  const tagListForIterationToDisplay: ITag[] =
    iterationTagFilterQuery.tagName.length > 0
      ? tagListForIterationWithoutSelectedAndFiltered
      : tagListForIterationWithoutSelected;

  const mapMarkersAfterFilter: IMarkersForMap[] = [...mapMarkersAndIterations]
    .filter((marker) =>
      new RegExp(placeFilterQuery.filterNameQuery, "i").test(marker.name)
    )
    .filter((marker) =>
      placeFilterQuery.tags.every((tag) => marker.tagsList.includes(tag))
    );

  useEffect(() => {
    getMapEditorTools();
    decideMapValidity();
  }, [userContextValue]);

  useEffect(() => {
    decideMapValidity();
  }, [formData]);

  useEffect(() => {
    decidePlaceIterationValidity();
  }, [iterationValues]);

  async function handleAdressButton(): Promise<void> {
    const results = await provider.search({ query: addressQuery });
    setNewResults(results);

    // If there is only one result possible, its address is assigned to the place
    if (results.length === 1) {
      setCoordinates({ latitude: results[0].y, longitude: results[0].x });
    }
  }

  async function getMapEditorTools() {
    try {
      if (checkPermission(userContextValue.status, UserType.User)) {
        // Getting all the tags available for the user
        const allTags = await tagService.fetchTagsForUser();
        const allTagsData: ITag[] = allTags.data;
        setTagList(allTagsData);
        setTagFilterList(allTagsData);

        // Getting all the places available for basic maps
        const allPlaces = await placeService.fetchAllPlaces();
        const allPlacesData: IPlace[] = allPlaces.data;
        setPlaceList(allPlacesData);

        // If the map is being edited, fetch the place iterations it already had and pre-fill all fields with the map's current values in the database
        if (props.editedMap) {
          const mapToEdit = await mapService.fetchMapsByIds([props.editedMap]);

          let mapToEditIterations: IPlaceUpdated[] = [];

          if (mapToEdit.data[0].placeIterationIds.length > 0) {
            const mapIterations =
              await placeIterationService.fetchPlaceIterationsByIds(
                mapToEdit.data[0].placeIterationIds
              );

            const mapIterationsData: IPlaceIteration[] = mapIterations.data;

            const adressData: string[] = mapIterationsData
              .map(
                (iteration) =>
                  allPlacesData.find((place) => place._id === iteration.placeId)
                    ?.address
              )
              .map((iterationAdress) =>
                iterationAdress !== undefined ? iterationAdress : ""
              );

            const editedMapIterations: IPlaceUpdated[] = mapIterationsData.map(
              (iteration, index) => ({
                address: adressData[index],
                description: iteration.customDescription,
                gpsCoordinates: {
                  longitude: iteration.gpsCoordinates.longitude,
                  latitude: iteration.gpsCoordinates.latitude,
                },
                _id: iteration._id,
                name: iteration.customName,
                place_id: iteration.placeId,
                tagsIdList: iteration.customTagIds,
                tagsList: allTagsData.filter((tag) =>
                  iteration.customTagIds.some(
                    (iterationTag) => tag._id === iterationTag
                  )
                ),
              })
            );

            mapToEditIterations = [
              ...mapToEditIterations,
              ...editedMapIterations,
            ];
          }

          setFormData({
            name: mapToEdit.data[0].name,
            description: mapToEdit.data[0].description,
            privacyStatus: mapToEdit.data[0].privacyStatus,
            participants: mapToEdit.data[0].participants,
            placeIterations: mapToEditIterations,
          });
          setIterationsList(mapToEditIterations);
          setIsValidForSending(true);
        }
      }
    } catch (err) {
      props.messageSetter({
        message:
          "An error has occured and we could not retrieve the data for our maps.",
        successStatus: false,
      });
    }
  }

  function decideMapValidity() {
    setIsValidForSending(
      formData.name.length > 1 && formData.description.length > 1
    );
  }

  function decidePlaceIterationValidity() {
    setIsValidPlaceIterationForSending(
      iterationValues.name.length > 1 && iterationValues.description.length > 1
    );
  }

  function updateField(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function updatePlaceFilterQueryFields(event) {
    setPlaceFilterQuery({
      ...placeFilterQuery,
      [event.target.name]: event.target.value,
    });
  }

  function updatePlaceIterationField(event) {
    setIterationValues({
      ...iterationValues,
      [event.target.name]: event.target.value,
    });
  }

  function manageIteration(place: IPlaceUpdated) {
    setIterationValues(place);
    setIsValidPlaceIterationForSending(true);
  }

  function doubleClickMaphandler(lon: number, lat: number) {
    setCoordinates({
      longitude: lon,
      latitude: lat,
    });
  }

  async function createIteration(event) {
    event.preventDefault();
    if (iterationValues.name.length > 0) {
      //Check if the iteration is being updated and not created
      if (
        iterationsList.some(
          (iteration) => iteration._id === iterationValues._id
        )
      ) {
        // Update the iteration
        const iterationToFind = iterationsList.find(
          (iteration) => iteration._id === iterationValues._id
        );
        const iterationIndex = iterationToFind
          ? iterationsList.indexOf(iterationToFind)
          : "0";
        iterationsList[iterationIndex] = iterationValues;
        setIterationsList(iterationsList);
      } else {
        // Create the iteration
        setFormData({
          ...formData,
          placeIterations: [...formData.placeIterations, iterationValues],
        });
        setIterationsList([...iterationsList, iterationValues]);
      }
      setIterationValues({
        address: "",
        description: "",
        gpsCoordinates: {
          longitude: null,
          latitude: null,
        },
        name: "",
        tagsIdList: [],
        tagsList: [],
      });
    }
  }

  async function sendRegistrationForm(event) {
    event.preventDefault();
    try {
      if (
        checkPermission(userContextValue.status, UserType.User) &&
        isValidForSending
      ) {
        if (!props.editedMap) {
          await mapService.generateMap(formData);
        } else {
          await mapService.updateMapById(props.editedMap, formData);
        }
        navigate("/mymaps");
        props.messageSetter({
          message: `Map ${
            props.editedMap ? "edited" : "created"
          } successfully.`,
          successStatus: true,
        });
      }
    } catch (err) {
      props.messageSetter({
        message: "An error has occured and we could not create this map.",
        successStatus: false,
      });
    }
  }

  return (
    <>
      {props.editedMap ? (
        <Helmet>
          <title>Edit map : {formData.name}</title>
          <link
            rel="canonical"
            href="https://marketplates.netlify.app/createmap"
          />
        </Helmet>
      ) : (
        <Helmet>
          <title>Create map : {formData.name}</title>
          <link
            rel="canonical"
            href="https://marketplates.netlify.app/createmap"
          />
        </Helmet>
      )}
      <h1 id={styles.mapEditiorTitle}>
        {props.editedMap
          ? `Editing ${formData.name}`
          : `Creating ${formData.name}`}
      </h1>
      <div id={styles.mapEditorContainer}>
        <aside id={styles.mapContainer} aria-label="Map">
          <MapContainer
            style={{ height: "100%", width: "100%" }}
            center={{ lat: 50.633333, lng: 3.066667 }}
            zoom={13}
            maxZoom={18}
          >
            <MapValuesManager
              latitude={coordinates.latitude}
              longitude={coordinates.longitude}
              doubleClickEvent={doubleClickMaphandler}
              startingZoom={13}
            />
            {/* Defines the style of the map */}
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {mapMarkersAfterFilter.length > 0 &&
              mapMarkersAfterFilter.map((place) => (
                <Marker
                  icon={mapMarkerIcon}
                  position={[
                    place.gpsCoordinates.latitude
                      ? place.gpsCoordinates.latitude
                      : 0,
                    place.gpsCoordinates.longitude
                      ? place.gpsCoordinates.longitude
                      : 0,
                  ]}
                  key={place._id}
                >
                  {/* Upon clicking the user either sees a place's data, or the iteration values for it*/}
                  <Popup key={place.name}>
                    <h3>{place.name}</h3>
                    {place.description}
                    <ul>
                      {place.tagsList.map((tag) => (
                        <li>
                          <Tag
                            tagName={tag.name}
                            customStyle={{
                              color: tag.nameColor,
                              backgroundColor: tag.backgroundColor,
                            }}
                            isTiny={true}
                            key={tag._id}
                          />
                        </li>
                      ))}
                      {!place.isIteration && (
                        <button
                          type="button"
                          onClick={() => manageIteration(place)}
                        >
                          Create a version
                        </button>
                      )}
                      {place.isIteration && (
                        <button
                          type="button"
                          onClick={() => manageIteration(place)}
                        >
                          Edit version
                        </button>
                      )}
                    </ul>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </aside>

        <main id={styles.mapSidebar} className={styles.mapForms}>
          <form className={formStyles.formContainer}>
            <button
              aria-label={`${
                mapDataCollapseVisible ? "Close" : "Open"
              } the Map data & privacy collapse`}
              type="button"
              onClick={() => setMapDataCollapseVisible(!mapDataCollapseVisible)}
              className={
                mapDataCollapseVisible
                  ? styles.collapseButtonActive
                  : styles.collapseButtonInactive
              }
            >
              Map data & privacy
              <span>
                {mapDataCollapseVisible ? (
                  <FontAwesomeIcon icon={solid("chevron-down")} />
                ) : (
                  <FontAwesomeIcon icon={solid("chevron-up")} />
                )}
              </span>
            </button>

            <article id={styles.mapDataContainer}>
              <article
                className={
                  mapDataCollapseVisible
                    ? styles.mapDataVisible
                    : styles.mapDataCollapsed
                }
              >
                {mapDataCollapseVisible && (
                  <>
                    <fieldset>
                      <legend>Map data</legend>
                      <label htmlFor="name">Name : </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        onInput={updateField}
                        value={formData.name}
                      />
                      <label htmlFor="description">Description : </label>
                      <input
                        type="text"
                        name="description"
                        required
                        onInput={updateField}
                        value={formData.description}
                      />
                    </fieldset>

                    <fieldset>
                      <legend>Privacy</legend>
                      <h4>Choose your privacy setting:</h4>
                      <div id={styles.privacyRadioContainer}>
                        <input
                          type="radio"
                          id="privacyStatus1"
                          name="privacyStatus"
                          value={PrivacyStatus.Private}
                          onChange={() => {
                            setFormData({
                              ...formData,
                              privacyStatus: PrivacyStatus.Private,
                            });
                          }}
                          checked={
                            formData.privacyStatus === PrivacyStatus.Private
                          }
                        />
                        <label htmlFor="privacyStatus1">Private</label>
                      </div>
                      <div>
                        <input
                          type="radio"
                          id="privacyStatus2"
                          name="privacyStatus"
                          value={PrivacyStatus.Protected}
                          onChange={() => {
                            setFormData({
                              ...formData,
                              privacyStatus: PrivacyStatus.Protected,
                            });
                          }}
                          checked={
                            formData.privacyStatus === PrivacyStatus.Protected
                          }
                        />
                        <label htmlFor="privacyStatus2">Friends</label>
                      </div>
                      <div>
                        <input
                          type="radio"
                          id="privacyStatus3"
                          name="privacyStatus"
                          value={PrivacyStatus.Public}
                          onChange={() => {
                            setFormData({
                              ...formData,
                              privacyStatus: PrivacyStatus.Public,
                            });
                          }}
                          checked={
                            formData.privacyStatus === PrivacyStatus.Public
                          }
                        />
                        <label htmlFor="privacyStatus3">Public</label>
                      </div>
                    </fieldset>
                  </>
                )}
              </article>

              <button
                aria-label={`${
                  addressCollapseVisible ? "Close" : "Open"
                } the Find an address collapse`}
                type="button"
                onClick={() =>
                  setAddressCollapseVisible(!addressCollapseVisible)
                }
                className={
                  addressCollapseVisible
                    ? styles.collapseButtonActive
                    : styles.collapseButtonInactive
                }
              >
                Find an address
                <span>
                  {addressCollapseVisible ? (
                    <FontAwesomeIcon icon={solid("chevron-down")} />
                  ) : (
                    <FontAwesomeIcon icon={solid("chevron-up")} />
                  )}
                </span>
              </button>
              <article
                className={
                  addressCollapseVisible
                    ? styles.addressVisible
                    : styles.addressCollapsed
                }
                style={{
                  height: addressCollapseVisible
                    ? `${13 + newResults.length * 2}rem`
                    : "0px",
                }}
                id={styles.addressListContainer}
              >
                <h3>Find an address</h3>
                <ul>
                  <label htmlFor="address">Get an address : </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    onInput={(e) => {
                      setAddressQuery(e.target.value);
                    }}
                  />

                  <li className={formStyles.finalButtonContainer}>
                    <button
                      type="button"
                      onClick={() => {
                        handleAdressButton();
                      }}
                    >
                      Get locations
                    </button>
                  </li>
                </ul>

                {newResults.length > 0 && (
                  <ul className={formStyles.addressClickables}>
                    {newResults.map((result) => (
                      <li
                        key={result.label}
                        onClick={() => {
                          setCoordinates({
                            longitude: result.x,
                            latitude: result.y,
                          });
                          setNewResults([]);
                        }}
                      >
                        {result.label}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
              <button
                aria-label={`${
                  iterationCollapseVisible ? "Close" : "Open"
                } the Filters collapse`}
                type="button"
                onClick={() =>
                  setFiltersCollapseVisible(!filtersCollapseVisible)
                }
                className={
                  filtersCollapseVisible
                    ? styles.collapseButtonActive
                    : styles.collapseButtonInactive
                }
              >
                Filters
                <span>
                  {filtersCollapseVisible ? (
                    <FontAwesomeIcon icon={solid("chevron-down")} />
                  ) : (
                    <FontAwesomeIcon icon={solid("chevron-up")} />
                  )}
                </span>
              </button>
              <article
                className={
                  filtersCollapseVisible
                    ? styles.addressVisible
                    : styles.addressCollapsed
                }
                id={styles.scrollableContainer}
                style={{
                  height: filtersCollapseVisible
                    ? `${
                        28 + Math.floor(placeFilterQuery.tags.length / 5) * 2
                      }rem`
                    : "0px",
                }}
              >
                <h3>Filtering place</h3>
                <ul>
                  <li>
                    <label htmlFor="filterNameQuery">
                      Filter places by name:{" "}
                    </label>
                    <input
                      type="text"
                      name="filterNameQuery"
                      id="filterNameQuery"
                      onInput={updatePlaceFilterQueryFields}
                      value={placeFilterQuery.filterNameQuery}
                    />
                  </li>
                  <li>
                    <label htmlFor="filterTagQuery">
                      Filter places by tags:{" "}
                    </label>
                    <input
                      type="text"
                      name="filterTagQuery"
                      id="filterTagQuery"
                      onInput={updatePlaceFilterQueryFields}
                      value={placeFilterQuery.filterTagQuery}
                    />
                  </li>
                  <li>
                    <span className={iconStyles.iconTitle}>Select tags:</span>
                    {tagListToDisplay.length > 0 &&
                      tagListToDisplay.map((tag) => (
                        <Tag
                          customStyle={{
                            color: tag.nameColor,
                            backgroundColor: tag.backgroundColor,
                          }}
                          tagName={tag.name}
                          onClick={() => {
                            setPlaceFilterQuery({
                              ...placeFilterQuery,
                              tags: [...placeFilterQuery.tags, tag],
                            });
                            setTagFilterList(
                              tagFilterList.filter(
                                (tagId) => tagId._id !== tag._id
                              )
                            );
                          }}
                          isIn={placeFilterQuery.tags.some(
                            (tagData) => tagData._id === tag._id
                          )}
                          isTiny={false}
                          key={tag.name}
                        />
                      ))}
                  </li>
                  {placeFilterQuery.tags.length > 0 && (
                    <li>
                      <span className={iconStyles.iconTitle}>Select tags:</span>
                      {placeFilterQuery.tags.map((tag) => (
                        <Tag
                          customStyle={{
                            color: tag.nameColor,
                            backgroundColor: tag.backgroundColor,
                          }}
                          tagName={tag.name}
                          onClose={() => {
                            setPlaceFilterQuery({
                              ...placeFilterQuery,
                              tags: placeFilterQuery.tags.filter(
                                (tagId) => tagId._id !== tag._id
                              ),
                            });
                            setTagFilterList([...tagFilterList, tag]);
                          }}
                          isIn={placeFilterQuery.tags.some(
                            (tagData) => tagData._id === tag._id
                          )}
                          isTiny={false}
                          key={tag.name}
                        />
                      ))}
                    </li>
                  )}
                  <li className={formStyles.finalButtonContainer}>
                    <button
                      type="button"
                      onClick={() => {
                        setPlaceFilterQuery({
                          filterNameQuery: "",
                          filterTagQuery: "",
                          tags: [],
                        });
                      }}
                    >
                      Clear filter
                    </button>
                  </li>
                </ul>
              </article>
            </article>
          </form>
          <article className={styles.mapForms}>
            {iterationValues.address.length > 0 && (
              <>
                <button
                  aria-label={`${
                    addressCollapseVisible ? "Close" : "Open"
                  } the Create / Edit iteration collapse`}
                  type="button"
                  onClick={() =>
                    setIterationCollapseVisible(!iterationCollapseVisible)
                  }
                  className={
                    iterationCollapseVisible
                      ? styles.collapseButtonActive
                      : styles.collapseButtonInactive
                  }
                >
                  Create / Edit iteration
                  <span>
                    {iterationCollapseVisible ? (
                      <FontAwesomeIcon icon={solid("chevron-down")} />
                    ) : (
                      <FontAwesomeIcon icon={solid("chevron-up")} />
                    )}
                  </span>
                </button>
                <article
                  className={
                    iterationCollapseVisible
                      ? styles.addressVisible
                      : styles.addressCollapsed
                  }
                  id={styles.scrollableContainer}
                  style={{
                    height: iterationCollapseVisible
                      ? `${
                          38 +
                          Math.floor(iterationValues.tagsList.length / 5) * 2
                        }rem`
                      : "0px",
                  }}
                >
                  <h2>
                    {iterationsList.some(
                      (iteration) => iteration._id === iterationValues._id
                    )
                      ? "Edit version"
                      : "Create a version"}
                  </h2>
                  <form className={formStyles.formContainer}>
                    <ul>
                      <li>
                        <label htmlFor="iterationName">Name : </label>
                        <input
                          type="text"
                          name="name"
                          id="iterationName"
                          required
                          onInput={(e) => {
                            updatePlaceIterationField(e);
                          }}
                          value={iterationValues.name}
                        />
                      </li>
                      <li>
                        <label htmlFor="iterationDescription">
                          Description :{" "}
                        </label>
                        <input
                          type="text"
                          name="description"
                          id="iterationDescription"
                          required
                          onInput={(e) => updatePlaceIterationField(e)}
                          value={iterationValues.description}
                        />
                      </li>
                      <p>Selected tags :</p>
                      {iterationValues.tagsList.length > 0 &&
                        tagList
                          .filter((tag) =>
                            iterationValues.tagsIdList.some(
                              (iterationTagId) => iterationTagId === tag._id
                            )
                          )
                          .map((tag) => (
                            <Tag
                              customStyle={{
                                color: tag.nameColor,
                                backgroundColor: tag.backgroundColor,
                              }}
                              tagName={tag.name}
                              onClose={() => {
                                setIterationValues({
                                  ...iterationValues,
                                  tagsList: iterationValues.tagsList.filter(
                                    (tagId) => tagId._id !== tag._id
                                  ),
                                  tagsIdList: iterationValues.tagsIdList.filter(
                                    (tagId) => tagId !== tag._id
                                  ),
                                });
                              }}
                              isIn={iterationValues.tagsList.some(
                                (tagData) => tagData._id === tag._id
                              )}
                              isTiny={false}
                              key={tag.name}
                            />
                          ))}
                      <p>
                        <label htmlFor="filterTagQueryIteration">
                          Filter tags:
                        </label>
                        <input
                          type="text"
                          name="filterTagQuery"
                          id="filterTagQueryIteration"
                          required
                          onInput={(e) => {
                            setIterationTagFilterQuery({
                              ...iterationTagFilterQuery,
                              tagName: e.target.value,
                            });
                          }}
                          value={iterationTagFilterQuery.tagName}
                        />
                      </p>
                      <p>Select tags:</p>
                      {tagListForIterationToDisplay.length > 0 &&
                        tagListForIterationToDisplay.map((tag) => (
                          <Tag
                            customStyle={{
                              color: tag.nameColor,
                              backgroundColor: tag.backgroundColor,
                            }}
                            tagName={tag.name}
                            onClick={() => {
                              setIterationValues({
                                ...iterationValues,
                                tagsList: [...iterationValues.tagsList, tag],
                                tagsIdList: [
                                  ...iterationValues.tagsIdList,
                                  tag._id,
                                ],
                              });
                            }}
                            isIn={iterationValues.tagsIdList.some(
                              (tagDataId) => tagDataId === tag._id
                            )}
                            isTiny={false}
                            key={tag.name}
                          />
                        ))}
                    </ul>
                    <button
                      className={styles.finalButtonContainer}
                      onClick={(e) => {
                        createIteration(e);
                      }}
                      disabled={!isValidPlaceIterationForSending}
                    >
                      {iterationsList.some(
                        (iteration) => iteration._id === iterationValues._id
                      )
                        ? "Edit version"
                        : "Create version"}
                    </button>
                  </form>
                </article>
              </>
            )}
          </article>
          <article
            id={styles.finalMapButtonContainer}
            className={formStyles.finalButtonContainer}
          >
            <button
              type="button"
              onClick={(e) => {
                sendRegistrationForm(e);
              }}
              disabled={!isValidForSending}
            >
              {props.editedMap ? "Edit map" : "Create map"}
            </button>
          </article>
        </main>
      </div>
    </>
  );
}

export default MapEditor;
