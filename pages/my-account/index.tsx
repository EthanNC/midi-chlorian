import AppLayout from "@lib/components/Layouts/AppLayout";
import { useSession, signIn } from "next-auth/react";
import { useQuery } from "react-query";
import superagent from "superagent";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";

const Page = () => {
  const router = useRouter();
  const { status, data: session } = useSession({
    required: false,
  });

  const { data, isLoading, error } = useQuery(
    ["my-session-account", session],
    async () => {
      const data = await superagent.get("/api/with-session-account");

      return data.body;
    },
    {
      // The query will not execute until the session exists
      enabled: !!session,
    }
  );

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const goToCheckout = async () => {
    setIsCheckoutLoading(true);
    // const res = await fetch(`/api/stripe/create-checkout-session`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // });

    const data = await superagent.post("/api/stripe/create-checkout-session");

    const { redirectUrl } = await data.body;
    if (redirectUrl) {
      window.location.assign(redirectUrl);
    } else {
      setIsCheckoutLoading(false);
      console.log("Error creating checkout session");
    }
  };

  if (status === "loading") {
    return "Loading or not authenticated...";
  }

  if (!session) {
    return (
      <>
        <AppLayout title="You Need to Sign In">
          <blockquote>
            <h1>Access Denied</h1>
            <h1>
              <button type="button" onClick={() => signIn()}>
                <a>Login</a>&nbsp;
              </button>
              to see a secret message
            </h1>
          </blockquote>
        </AppLayout>
      </>
    );
  }

  return (
    <>
      <AppLayout title="My Account">
        <div>
          <h1>
            Hello,{" "}
            <span className="font-bold uppercase">{`${
              session?.user?.name ?? session?.user?.email
            }`}</span>
            <br />
            You can see this because you're logged in.
          </h1>
          {data && <p>{data.content}</p>}
        </div>

        <Image src="/assets/profile.png" width={250} height={200} />
        <div>{session?.user?.email}</div>
        {data?.user?.id && <p>{data.user.id}</p>}
        {data?.user?.role && <p>{data.user.role}</p>}
        {data?.user?.role === "admin" && (
          <button onClick={() => router.push("/admin")}>
            Go to admin dasboard
          </button>
        )}
        {data?.user?.role === "user" && !data?.user?.isSubscribed ? (
          <div>
            <button
              onClick={() => {
                if (isCheckoutLoading) return;
                else goToCheckout();
              }}
            >
              {isCheckoutLoading ? "Loading..." : "Add Payment Method"}
            </button>
          </div>
        ) : (
          <div className="font-bold text-2xl leading-relaxed">
            Your are subscribed!
          </div>
        )}
      </AppLayout>
    </>
  );
};

export default Page;
