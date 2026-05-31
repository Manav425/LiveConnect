import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken, getAIMessage } from "../lib/api";
import {
  Channel, ChannelHeader, Chat,
  MessageInput, MessageList, Thread, Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import { BotMessageSquare, X, Send, Loader } from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    { role: "ai", text: "Hi! I'm Lingua 👋 I can help you translate, correct grammar, or suggest conversation starters. Try asking me something!" }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;
      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);
        await client.connectUser(
          { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
          tokenData.token
        );
        const channelId = [authUser._id, targetUserId].sort().join("-");
        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });
        await currChannel.watch();
        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;
      channel.sendMessage({ text: `I've started a video call. Join me here: ${callUrl}` });
      toast.success("Video call link sent successfully!");
    }
  };

  const handleAISend = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setAiInput("");
    setAiLoading(true);
    try {
      const data = await getAIMessage(userMsg, targetUserId);
      setAiMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch {
      setAiMessages((prev) => [...prev, { role: "ai", text: "Sorry, something went wrong. Try again!" }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh] flex">
      <div className="flex-1 relative">
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <div className="w-full relative">
              <div className="absolute top-3 right-20 z-10">
                <button
                  onClick={() => setShowAI((prev) => !prev)}
                  className="btn btn-sm btn-primary gap-2"
                >
                  <BotMessageSquare className="size-4" />
                  Lingua AI
                </button>
              </div>
              <CallButton handleVideoCall={handleVideoCall} />
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageInput focus />
              </Window>
            </div>
            <Thread />
          </Channel>
        </Chat>
      </div>

      {/* Lingua AI Panel */}
      {showAI && (
        <div className="w-80 border-l border-base-300 flex flex-col bg-base-100">
          <div className="flex items-center justify-between p-3 border-b border-base-300">
            <div className="flex items-center gap-2 font-semibold">
              <BotMessageSquare className="size-4 text-primary" />
              Lingua AI
            </div>
            <button onClick={() => setShowAI(false)}>
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {aiMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-lg px-3 py-2 text-sm max-w-[90%] ${
                  msg.role === "user" ? "bg-primary text-primary-content" : "bg-base-200"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-base-200 rounded-lg px-3 py-2">
                  <Loader className="size-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-base-300 flex gap-2">
            <input
              type="text"
              className="input input-bordered input-sm flex-1"
              placeholder="Ask Lingua..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAISend()}
            />
            <button onClick={handleAISend} className="btn btn-sm btn-primary" disabled={aiLoading}>
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;