import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser
} from "@clerk/clerk-react";
import Dashboard from "./pages/Dashboard";
import { Button } from "./components/ui/button";

export default function App() {
  const { user } = useUser();
  const displayName = user?.fullName || user?.username || user?.firstName || "Guest";
  const email = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-purple-400 animate-pulse"></div>
          <div className="absolute top-3/4 right-1/3 h-1 w-1 rounded-full bg-blue-400 animate-pulse delay-75"></div>
          <div className="absolute top-1/3 right-1/4 h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse delay-150"></div>
          <div className="absolute bottom-1/4 left-1/3 h-1 w-1 rounded-full bg-violet-400 animate-pulse delay-300"></div>
        </div>
      </div>

      <header className="relative border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-violet-600">
                <span className="text-sm font-bold text-white">⚡</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-300">
                  Real-Time Chat Platform
                </p>
                <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  PulseChat
                </h1>
              </div>
            </div>
            <p className="text-sm text-purple-200/80 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              LIVE • MERN STACK • SOCKET.IO • REAL-TIME 🌐 ANYWHERE 🟣ANYTIME
            </p>
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 border-0 text-white font-semibold shadow-lg shadow-purple-500/25">
                  🚀 Get Started
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-3 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-violet-500/10 px-4 py-2.5 text-sm text-white backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="font-medium">{displayName}</span>
                </div>
                <div className="h-4 w-px bg-purple-400/30"></div>
                <UserButton 
                  afterSignOutUrl="/" 
                  showName={false}
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8 border-2 border-purple-400/30"
                    }
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col">
        <SignedOut>
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 text-center">
            {/* Hero Section */}
            <div className="space-y-8">
              {/* Main Heading */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-200 backdrop-blur-sm">
                  <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                  REAL-TIME COMMUNICATION PLATFORM
                </div>
                <h2 className="text-5xl font-bold text-white leading-tight">
                  Connect & Chat in
                  <span className="block bg-gradient-to-r from-purple-300 via-white to-violet-300 bg-clip-text text-transparent">
                    Real Time
                  </span>
                </h2>
                <p className="text-xl text-purple-100/80 max-w-2xl mx-auto leading-relaxed">
                  Experience seamless real-time messaging with advanced features like typing indicators, 
                  file sharing, and live user status. Built with modern web technologies.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {[
                  { icon: "⚡", title: "Instant Messages", desc: "Real-time delivery" },
                  { icon: "👥", title: "Live Status", desc: "See who's online" },
                  { icon: "📁", title: "File Sharing", desc: "Share images & files" }
                ].map((feature, index) => (
                  <div key={index} className="rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-transparent p-6 text-center backdrop-blur-sm">
                    <div className="text-2xl mb-3">{feature.icon}</div>
                    <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-purple-200/70">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <SignInButton mode="modal">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold text-lg px-8 py-6 rounded-2xl shadow-2xl shadow-purple-500/25 transform hover:scale-105 transition-all duration-200">
                  <span className="flex items-center gap-2">
                    🚀 Start Chatting Now
                  </span>
                </Button>
              </SignInButton>

              {/* Stats */}
              <div className="flex items-center justify-center gap-8 text-sm text-purple-200/60">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Live Updates</span>
                </div>
                <div className="h-4 w-px bg-purple-400/30"></div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                  <span>Secure Auth</span>
                </div>
                <div className="h-4 w-px bg-purple-400/30"></div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                  <span>Group Chats</span>
                </div>
              </div>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <Dashboard
            currentUserId={user?.id}
            currentAvatar={user?.imageUrl}
            currentName={displayName}
            currentEmail={email}
          />
        </SignedIn>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-black/20 backdrop-blur-xl py-6">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm text-purple-200/60">
            Built with ⚡ by <span className="text-purple-300">Phillip Kimonyi. plp student</span> • 
            🔥ULTRA-FAST REAL-TIME MESSAGING 
          </p>
        </div>
      </footer>
    </div>
  );
}
