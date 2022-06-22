import { filter } from "lodash";
import { GetServerSidePropsContext } from "next";
import {
  getSession,
  getCsrfToken,
  signIn,
  getProviders,
  ClientSafeProvider,
} from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";

const MINIMUM_ACTIVITY_TIMEOUT = 850;

type LoginFormValues = {
  csrfToken: string;
  email: string;
  password: string;
};

//TODO: This is a copy of the code from pages/admin/sign-in.tsx Need to add Provider back with type below
type Props = {
  csrfToken: string | undefined;
  providers: ClientSafeProvider;
};

export default function Page({ csrfToken }: Props) {
  const [isSubmitting, setSubmitting] = React.useState(false);

  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: LoginFormValues) => {
    setSubmitting(true);
    try {
      signIn("app-login", {
        callbackUrl: "/",
        email: data.email,
        password: data.password,
      });

      setTimeout(() => {
        setSubmitting(false);
      }, MINIMUM_ACTIVITY_TIMEOUT);
    } catch (error) {
      console.error(error);
      //   setError(error)
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen  flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Sign In</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center py-12">
        <img
          className="h-16 mx-auto"
          src="/assets/planet-scale.svg"
          alt="PlanetScale Logo"
        />
      </div>
      <div className=" flex flex-col justify-center py-12 sm:px-6 lg:px-8 mt-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center ">
          <p>
            If you are an Admin login Removed Provider for now{" "}
            <Link href="/admin/sign-in">here</Link>
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="py-8 px-4 mx-2 rounded-sm sm:px-10">
            <form className="text-center" onSubmit={handleSubmit(onSubmit)}>
              <input
                {...register("csrfToken")}
                name="csrfToken"
                type="hidden"
                defaultValue={csrfToken}
                hidden
              />
              <div className="">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-neutral-400"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    {...register("email")}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none w-full font-medium py-3 border-b border-t-0 border-l-0 border-r-0 border-dashed outline-none text-xl text-center leading-6 bg-transparent placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 transition duration-150 ease-in-out"
                  />
                </div>
              </div>

              <div>
                <div className="mt-8">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-neutral-400"
                  >
                    Password
                  </label>
                </div>
                <div className="mt-1">
                  <input
                    {...register("password")}
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    minLength={12}
                    required
                    className="appearance-none w-full font-medium py-3 border-b border-t-0 border-l-0 border-r-0 border-dashed outline-none text-xl text-center leading-6 bg-transparent placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 transition duration-150 ease-in-out"
                  />
                </div>
              </div>

              <div className="mt-16 space-y-2 flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button button__round button__md button__primary w-full"
                >
                  {isSubmitting ? (
                    <img src="/assets/loading.svg" />
                  ) : (
                    <p>Sign In</p>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (session) {
    return { redirect: { permanent: false, destination: "/" } };
  }

  return {
    props: { csrfToken: await getCsrfToken({ req: context.req }) },
  };
}
