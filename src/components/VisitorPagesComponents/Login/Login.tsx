import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ILoginValues,
  ISessionValues,
} from "../../../common/types/userTypes/userTypes.js";
import * as authenticationService from "../../../services/authenticationService.js";
import styles from "./Login.module.scss";
import formStyles from "../../../common/styles/Forms.module.scss";
import ReCAPTCHA from "react-google-recaptcha";
import * as jose from "jose";
import UserContext from "../../Contexts/UserContext/UserContext.js";
import { Helmet } from "react-helmet";
import { IMessageValues } from "../../../common/types/commonTypes.ts/commonTypes.js";

function Login(props: {
  contextSetter: React.Dispatch<ISessionValues>;
  messageSetter: React.Dispatch<IMessageValues>;
}) {
  // Setting states
  // Contains the data needed for a user to log in
  const [loginData, setLoginData] = useState<ILoginValues>({
    email: "",
    password: "",
  });

  // Sets whether or not the user can try to login again
  const [canRetry, setCanRetry] = useState(true);

  const navigate = useNavigate();

  // Sets up the captcha value to be changed upon clicking
  const captcha = useRef(null);

  // Fetching the user's current data
  const userContextValue = useContext(UserContext);

  // Serves to check if all values have the correct number of characters
  const [validForSending, setValidForSending] = useState(false);

  // Each time an input is modified we check if the form is valid for sending
  useEffect(() => {
    decideLoginValidity();
  }, [loginData]);

  // Modifying the form's data according to the modifications in a specific input
  function updateField(event) {
    setLoginData({
      ...loginData,
      [event.target.name]: event.target.value,
    });
  }

  // Regex for email validation
  const emailPattern =
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

  // Data validation made to match the back end specifications
  function decideLoginValidity() {
    setValidForSending(
      loginData.email.length > 3 &&
        loginData.password.length >= 12 &&
        emailPattern.test(loginData.email)
    );
  }

  // Sending data to the back end
  async function sendLoginForm(event) {
    event.preventDefault();
    // Check if an user is already logged in, if so, redirect them without going through the log in process
    if (userContextValue.userId.length > 0) {
      navigate("/");
    }
    if (canRetry && validForSending) {
      if (
        captcha.current !== null &&
        captcha.current.getValue().toString().length > 0
      ) {
        try {
          const captchaToken: string = captcha.current.getValue().toString();
          const response = await authenticationService.login(
            loginData,
            captchaToken
          );
          // Sets the refresh token within the session storage
          localStorage.setItem("refreshToken", response.refreshToken);
          const refreshTokenData: ISessionValues = jose.decodeJwt(
            response.refreshToken
          );
          props.contextSetter(refreshTokenData);
          props.messageSetter({
            message: "Welcome!",
            successStatus: true,
          });
          navigate("/");
        } catch (err) {
          props.messageSetter({
            message: "Invalid credentials",
            successStatus: false,
          });
          setCanRetry(false);
          putLoginToSleep(1500);
          window.grecaptcha.reset();
        }
      } else {
        props.messageSetter({
          message: "The captcha was not checked, try again.",
          successStatus: false,
        });
        setCanRetry(false);
        putLoginToSleep(500);
      }
    } else {
      props.messageSetter({
        message: "Please wait for a moment before trying again.",
        successStatus: false,
      });
      window.grecaptcha.reset();
    }
  }

  // Upon failing logging in, a set of time is given until the next login attempt
  function putLoginToSleep(time: number) {
    setTimeout(() => {
      setCanRetry(true);
    }, time);
  }

  return (
    <>
      <Helmet>
        <title>Login</title>
        <link rel="canonical" href="http://localhost:5173/login" />
        <script
          src={`https://google.com/recaptcha/api.js?render=${
            import.meta.env.VITE_REACT_APP_GOOGLE_SITE_KEY
          }`}
        ></script>
      </Helmet>

      <article className={formStyles.formContainer}>
        <form onSubmit={sendLoginForm}>
          <h1>Sign in</h1>
          <ul>
            <li>
              <label htmlFor="email">Email</label>
              <input
                type="text"
                name="email"
                id="email"
                required
                onInput={updateField}
                placeholder="Email"
              />
            </li>
            <li>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                name="password"
                id="password"
                required
                onInput={updateField}
                placeholder="Password"
              />
            </li>
          </ul>
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_REACT_APP_GOOGLE_SITE_KEY}
            ref={captcha}
            id={styles.captchaContainer}
            style={{
              transform: "scale(0.77)",
            }}
          />
          <div className={formStyles.finalButtonContainer}>
            <button type="submit" disabled={!validForSending}>
              Log in
            </button>
          </div>

          <span id={styles.registerAlternative}>Don't have an account?</span>

          <div id={styles.registerButtonContainer}>
            <button type="button" onClick={() => navigate("/register")}>
              Register
            </button>
          </div>
        </form>
      </article>
    </>
  );
}

export default Login;
