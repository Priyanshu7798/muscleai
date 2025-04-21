"use client"

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { vapi } from '@/lib/vapi';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {useEffect, useRef, useState} from 'react'

const GenerateProgramPage = () => {

  const [callActive , setCallActive] = useState(false);
  const [connecting , setConnecting] = useState(false);
  const [isSpeaking , setIsSpeaking] = useState(false);
  const [messages , setMessages] = useState<any[]>([]);
  const [callEnded , setCallEnded] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null)

  const {user} = useUser();
  const router = useRouter();

  // auto-scroll messages
  useEffect(()=>{
    if(messageContainerRef.current){
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight
    }
  },[messages])

  // navigate user to profile page after the call ends
  useEffect(()=>{
    if(callEnded){
      const redirectTimer = setTimeout(()=>{
        router.push("/profile")
        
      },1500);

      return () => clearTimeout(redirectTimer);
    }
  },[callEnded,router])

  // setup event listeners for VAPI
  useEffect(()=>{

   const handleCallStart = ()=>{
    console.log("call started")
    setConnecting(false)
    setCallActive(true)
    setCallEnded(false)
   }

   const handleCallEnd = ()=>{
    console.log("Call ended")
    setConnecting(false);
    setCallActive(false)
    setCallEnded(true)
    setIsSpeaking(false)
   }

   const handleSpeechStart = ()=>{
    console.log("AI Speech Start")
    setIsSpeaking(true)
   }

   const handleSpeechEnd = ()=>{
    console.log("AI Speech End")
    setIsSpeaking(false)
   }

   const handleMessage = (message:any)=>{
      console.log("VAPI message",message);
        if(message.type === "transcript" && message.transcriptType === "final"){
        const newMessage = {
          content :message.transcript,
          role: message.role
        }
        setMessages((prev)=>[...prev,newMessage])
      }
    }

   const handleError = (error:any)=>{
    console.log("VAPI error",error)
    setConnecting(false);
    setCallActive(false);
   }


    vapi.on("call-start",handleCallStart)
        .on("call-end",handleCallEnd)
        .on("speech-start",handleSpeechStart)
        .on("speech-end",handleSpeechEnd)
        .on("message",handleMessage)
        .on('error',handleError)

    // clean up event listners
    return ()=>{
      vapi.off("call-start",handleCallStart)
          .off("call-end",handleCallEnd)
          .off("speech-start",handleSpeechStart)
          .off("speech-end",handleSpeechEnd)
          .off("message",handleMessage)
          .off('error',handleError)
    }
  },[])

  const toggleCall = async ()=>{
    if(callActive){
      vapi.stop();
    }else{
      try {
        setConnecting(true);
        setMessages([]);
        setCallEnded(false);
  
        const fullName = user?.firstName ? `${user.firstName || "z"} ${user.lastName || ""}`.trim() : "There";
  
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!,{
          variableValues:{
            full_name : fullName,
            user_id : user?.id,
          }
        });
      } catch (error) {
        console.log(error,"Vapi error")
        setConnecting(false);
      }
    }
  }
  return (
    <div className='flex flex-col min-h-screen text-foreground overflow-hidden pb-6 pt-24'>
      <div className="container mx-auto px-4 h-full max-w-5xl"> 
        {/* title */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold font-mono'>
            <span>Generate Your</span>
            <span className='text-primary uppercase'> Fitness Program</span>
          </h1>
          <p className='text-muted-foreground mt-2'>
            Have a voice conversation with our AI assistant for perosnalized plan
          </p>
        </div>


        {/* call controls */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
          {/* AI ASSISTANT */}
          <Card className='bg-card/90 backdrop-blur-sm border-border overflow-hidden relative'>
            <div className='aspect-video flex flex-col items-center justify-center p-6 relative'>
             {/* AI VOICE ANIMATION */}
              <div
                className={`absolute inset-0 ${
                  isSpeaking ? "opacity-30" : "opacity-0"
                } transition-opacity duration-300`}
              >
                  {/* Voice wave animation when speaking */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center h-20">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`mx-1 h-16 w-1 bg-primary rounded-full ${
                          isSpeaking ? "animate-sound-wave" : ""
                        }`}
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          height: isSpeaking ? `${Math.random() * 50 + 20}%` : "5%",
                        }}
                      />
                    ))}
                  </div>
              </div>

              {/* AI VOICE AVATAR */}
              <div className='size-32 relative mb-4'>
                <div 
                  className={`absolute inset-0 bg-primary opacity-0 rounded-full blur-lg ${isSpeaking ? "animate-pulse" : ""}`}
                />
                
                <div className='relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden'>
                    <div 
                      className='absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10'
                    />
                    
                    <img
                     src="/bot.png"
                     alt="AI - Assistant" 
                    />
                </div>
              </div>
              
              <h2 className='text-xl font-bold text-foreground'>Muscle AI</h2>
              <p className='text-sm text-muted-foreground mt-1'>Fitness & Diet Coach</p>


              {/* Speaking Indicator */}

              <div
               className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border ${
                isSpeaking ? "border-primary" : ""
               } `}
              >
                
                <div 
                  className={`w-2 h-2 rounded-full ${
                    isSpeaking? 'animate-pulse bg-primary':'bg-muted'
                  }`}
                />

                <span>
                  {isSpeaking? "Speaking..." : callActive ? "Listening..." : callEnded ? 'Redirecting To Profile' : "Waiting.."}
                </span>

              </div>
            </div>
          </Card>

          {/* User Card */}
          <Card className={`bg-card/90 backdrop-blur-sm border overflow-hidden relative`}>
            <div className='aspect-video flex flex-col items-center justify-center p-6 relative'>
              {/* User image */}
              <div className='relative size-32 mb-4'>
                <img 
                  src={user?.imageUrl} 
                  alt="User" 
                  className='object-cover rounded-full '
                />
              </div>

              <h2 className='text-xl font-bold text-foreground'>You</h2>
              <p className='text-sm text-muted-foreground mt-1'>
                {user ? (user.firstName + " " + (user.lastName || "")).trim() : 'Guest'}
              </p>

              {/* User Ready Text */}

              <div className='flex items-center gap-2 px-3 py-1 rounded-full bg-card border mt-4'>
                <div className='w-2 h-2 rounded-full bg-muted' />
                <span className='text-xs text-muted-foreground'>Ready</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Message Container */}

        {messages.length >0 && (
          <div 
            ref={messageContainerRef}
            className='w-full bg-card/90 backdrop-blur-sm border border-border rounded-xl overflow-y-auto p-4 mb-8 h-64 transition-allduration-300 scroll-smooth '
          >
            <div className='space-y-3'>
              {messages.map((msg,index)=>(
                <div key={index} className='message-item animate-fadeIn'>
                  <div className='font-semibold text-xs text-muted-foreground mb-1'>
                    {msg.role === "assistant" ? "Muscle AI": "You"}
                  </div>
                  <p className='text-foreground'>{msg.content}</p>
                </div>
              ))}

              {callEnded && (
                <div className='message-item animate-fadeIn'>
                  <div className='font-semibold text-xs text-primary mb-1'>
                    System:
                  </div>
                  <p className='text-foreground'>
                    Your Fitness Program has been generated! Redirecting to your profile...
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* call controls */}
        <div className='w-full flex justify-center gap-4'>
          <Button
            className={`w-40 text-xl rounded-3xl ${
              callActive
              ? "bg-destructive hover:bg-destructive/90"
              : callEnded 
                ? "bg-green-600 hover:bg-green-700"
                : "bg-primary hover:bg-primary/90"
              
            }`}
            onClick={toggleCall}
            disabled={connecting || callEnded}
          >
            {connecting && (
              <span className='absolute inset-0 rounded-full animate-ping bg-primary/50 opacity-75'></span>
            )}

            <span>
              {callActive 
                ? "End Call" 
                : connecting
                  ? "Connecting..."
                  : callEnded
                    ? "View Profile"
                    : "Start Call"
              }
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default GenerateProgramPage