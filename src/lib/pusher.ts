import Pusher from "pusher";

const pusherInstance = new Pusher({
  appId: process.env.pusher_app_id!,
  key: process.env.NEXT_PUBLIC_pusher_key!,
  secret: process.env.pusher_secret!,
  cluster: process.env.NEXT_PUBLIC_pusher_cluster!,
  useTLS: true,
});

export default pusherInstance;
