import AppLayout from "@lib/components/Layouts/AppLayout";
import { useSession, signIn } from "next-auth/react";
import { useQuery } from "react-query";
import superagent from "superagent";
import Image from "next/image";
import { useRouter } from "next/router";

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

  if (status === "loading") {
    return "Loading or not authenticated...";
  }

  console.log(" Profile", data);

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
        <button onClick={() => router.push("/admin")}>
          Go to admin dasboard
        </button>
      </AppLayout>
    </>
  );
};

export default Page;
