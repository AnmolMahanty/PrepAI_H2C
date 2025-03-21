import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Mic, MicOff, Loader2, BrainCircuit } from "lucide-react";

function MomBot() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());
  const audioBuffersRef = useRef([]); // For TTS audio chunks
  const audioQueueRef = useRef([]); // Queue for ordered playback
  const currentPlayingIndexRef = useRef(0); // Track current playing chunk

  // Add suggested prompts
  const suggestionPrompts = [
    "Help me understand recursion",
    "Explain binary trees",
    "How to master data structures?",
    "Tips for solving algorithms",
  ];

  useEffect(() => {
    // Connect to the backend server
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    // Listen for transcription
    socketRef.current.on("transcription", (transcription) => {
      console.log("Received transcription:", transcription);
      // Update the last user message with the actual transcription
      setMessages((prev) => {
        const newMessages = [...prev];
        // Find and replace the "Processing..." message with actual transcription
        const processingIndex = newMessages.findIndex(
          (msg) =>
            msg.role === "user" && msg.content === "Processing your speech..."
        );

        if (processingIndex !== -1) {
          newMessages[processingIndex] = {
            role: "user",
            content: transcription,
          };
        } else {
          // Just in case, add it if not found
          newMessages.push({ role: "user", content: transcription });
        }
        return newMessages;
      });
    });

    // Listen for AI responses
    socketRef.current.on("ai-response-text", (response) => {
      console.log("Received AI response:", response);
      setMessages((prev) => [...prev, { role: "ai", content: response }]);
    });

    // Handle audio stream from the server
    socketRef.current.on("tts-chunk", (chunkData) => {
      // We're now receiving an object with audio and index
      console.log(`Received audio chunk ${chunkData.index}`);

      try {
        // Extract the audio data
        const audioData = chunkData.audio;

        if (!audioData) {
          console.error(`Chunk ${chunkData.index} has no audio data`);
          return;
        }

        // Store chunks in ordered array
        audioQueueRef.current[chunkData.index] = audioData;

        // Only start playing if no audio is currently playing AND this is the chunk we're waiting for
        if (
          chunkData.index === currentPlayingIndexRef.current &&
          !isAudioPlaying()
        ) {
          console.log(`Playing chunk ${chunkData.index} immediately`);
          playNextChunk();
        } else {
          console.log(`Queued chunk ${chunkData.index} for later playback`);
        }

        setIsAiSpeaking(true);
      } catch (error) {
        console.error("Error handling audio chunk:", error);
      }
    });

    socketRef.current.on("tts-complete", () => {
      console.log("Received TTS complete signal");
      // Reset for next round of audio when all chunks are done playing
      if (!isAudioPlaying()) {
        console.log("Audio not playing, resetting queue");
        audioQueueRef.current = [];
        currentPlayingIndexRef.current = 0;
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      // Clean up any created object URLs
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  // Function to check if audio is currently playing
  const isAudioPlaying = () => {
    return !audioRef.current.paused;
  };

  // Function to play the next chunk in sequence
  const playNextChunk = () => {
    // If audio is currently playing, don't start a new chunk
    if (isAudioPlaying()) {
      console.log("Audio already playing, waiting to play next chunk");
      return;
    }

    const nextIndex = currentPlayingIndexRef.current;
    console.log(`Attempting to play chunk ${nextIndex}`);
    const chunk = audioQueueRef.current[nextIndex];

    if (!chunk) {
      console.log(`No chunk available at index ${nextIndex}`);
      return; // No chunk available yet
    }

    // Clean up previous URL if exists
    if (audioRef.current.src) {
      URL.revokeObjectURL(audioRef.current.src);
    }

    try {
      // Make sure chunk is a Buffer/ArrayBuffer/Uint8Array
      console.log(
        `Chunk type: ${typeof chunk}, isArray: ${Array.isArray(chunk)}`
      );

      // Convert to array buffer if needed
      let audioData = chunk;
      if (
        typeof chunk === "object" &&
        !ArrayBuffer.isView(chunk) &&
        !(chunk instanceof ArrayBuffer)
      ) {
        console.log("Converting object to typed array");
        // If it's an object with buffer data (from socket.io transfer)
        if (chunk.type === "Buffer" && Array.isArray(chunk.data)) {
          audioData = new Uint8Array(chunk.data);
        } else {
          console.error("Unknown chunk format:", chunk);
          currentPlayingIndexRef.current++; // Skip this chunk
          if (currentPlayingIndexRef.current < audioQueueRef.current.length) {
            playNextChunk(); // Try next chunk
          }
          return;
        }
      }

      // Create and play the audio
      const audioBlob = new Blob([audioData], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;

      console.log(`Playing chunk ${nextIndex}`);
      // Play the audio
      audioRef.current
        .play()
        .then(() => {
          console.log(`Successfully started playing chunk ${nextIndex}`);
          // Increment index for next chunk
          currentPlayingIndexRef.current++;
        })
        .catch((err) => {
          console.error(`Audio playback error for chunk ${nextIndex}:`, err);
          // Skip this chunk if it fails
          currentPlayingIndexRef.current++;
          if (currentPlayingIndexRef.current < audioQueueRef.current.length) {
            setTimeout(() => playNextChunk(), 10); // Try next chunk after a small delay
          }
        });
    } catch (error) {
      console.error(`Error processing chunk ${nextIndex}:`, error);
      // Skip problematic chunk
      currentPlayingIndexRef.current++;
      if (currentPlayingIndexRef.current < audioQueueRef.current.length) {
        setTimeout(() => playNextChunk(), 10); // Try next chunk after a small delay
      }
    }
  };

  // Setup audioRef ended event to play next chunk
  useEffect(() => {
    audioRef.current.onended = () => {
      console.log(
        `Finished playing chunk ${currentPlayingIndexRef.current - 1}`
      );

      // Try to play the next chunk
      if (
        currentPlayingIndexRef.current < audioQueueRef.current.length &&
        audioQueueRef.current[currentPlayingIndexRef.current]
      ) {
        console.log(`Playing next chunk ${currentPlayingIndexRef.current}`);
        playNextChunk();
      } else {
        console.log("No more chunks to play");
        // All chunks played
        setIsAiSpeaking(false);
        // Auto-resume listening after AI stops speaking
        if (!isListening && isConnected) {
          console.log("Auto-resuming listening");
          startListening();
        }

        // Reset for next interaction
        audioQueueRef.current = [];
        currentPlayingIndexRef.current = 0;
      }
    };
  }, [isListening, isConnected]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Detect silence and automatically send audio
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.minDecibels = -85;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let silenceStart = Date.now();
      const silenceDelay = 1500; // 1 seconds of silence before stopping

      const checkSilence = () => {
        if (!isListening || isAiSpeaking) return;

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }

        const average = sum / bufferLength;

        if (average < 5) {
          // Very low volume threshold
          if (Date.now() - silenceStart > silenceDelay) {
            stopListeningAndSend();
            return;
          }
        } else {
          silenceStart = Date.now();
        }

        requestAnimationFrame(checkSilence);
      };

      mediaRecorderRef.current.onstart = () => {
        silenceStart = Date.now();
        checkSilence();
      };

      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          sendAudioToServer(audioBlob);
        }
      };

      mediaRecorderRef.current.start(100); // Collect 100ms chunks
      setIsListening(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopListeningAndSend = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    // Only send if there's actual content
    if (audioBlob.size > 1000) {
      // Avoid sending tiny audio chunks
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result;
        socketRef.current.emit("speech-data", buffer);
        setMessages((prev) => [
          ...prev,
          { role: "user", content: "Processing your speech..." },
        ]);
      };
      reader.readAsArrayBuffer(audioBlob);
    } else {
      console.log("Audio too short, not sending");
    }
  };

  return (
    <div className="w-full bg-white">
      <div className="border-b border-black/10 flex items-center h-20 px-8">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-[#c4e456]" />
          <h3 className="text-2xl text-gray-700">MOM AI</h3>
        </div>
      </div>

      <div className="w-full flex flex-col gap-4 px-8 pt-10">
        <div className="w-full max-w-3xl mx-auto">
          {/* Welcome message when no messages */}
          {messages.length === 0 && (
            <div className="text-center mb-8 animate-fade-in">
              <h2 className="text-xl font-medium text-gray-800 mb-3">
                Welcome to Your AI Study Assistant
              </h2>
              <p className="text-gray-600 mb-6">
                I can help you understand complex topics, take a pop quiz or
                just be there for you. Just start speaking or ask me anything!
              </p>
            </div>
          )}

          {/* Conversation container with improved styling */}
          <div
            className="conversation-container h-[calc(100vh-300px)] overflow-y-auto 
                        border border-gray-200 rounded-lg p-4 bg-[#fafafa] mb-6 
                        scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                <BrainCircuit className="h-12 w-12 text-[#c4e456] animate-pulse" />
                <p>
                  Start a conversation by clicking the microphone button below
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } animate-fade-in-up`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-[#c4e456] text-black ml-6"
                          : "bg-gray-100 mr-6"
                      } ${
                        msg.content === "Processing your speech..."
                          ? "animate-pulse"
                          : ""
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status indicators */}
          <div className="status-indicator mb-4 flex justify-center gap-4">
            {!isConnected && (
              <p className="text-red-500 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                Disconnected from server
              </p>
            )}
            {isAiSpeaking && (
              <p className="text-green-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is speaking...
              </p>
            )}
            {isListening && (
              <p className="text-blue-500 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                Listening...
              </p>
            )}
          </div>

          {/* Microphone button with animation */}
          <div className="flex justify-center">
            <button
              onClick={isListening ? stopListeningAndSend : startListening}
              disabled={!isConnected || isAiSpeaking}
              className={`p-4 rounded-full transition-all duration-300 ${
                isListening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#c4e456] hover:bg-[#b3d34a]"
              } ${
                !isConnected || isAiSpeaking
                  ? "opacity-50 cursor-not-allowed"
                  : "transform hover:scale-110"
              }`}
            >
              {isListening ? (
                <MicOff className="h-6 w-6 text-white" />
              ) : (
                <Mic className="h-6 w-6 text-black" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add custom keyframes */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default MomBot;
