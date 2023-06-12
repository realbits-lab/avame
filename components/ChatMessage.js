import React from "react";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Box from "@mui/material/Box";
import MenuIcon from "@mui/icons-material/Menu";
import MicIcon from "@mui/icons-material/Mic";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import { Z_INDEX } from "@/components/RealBitsUtil";
import { Typography } from "@mui/material";

export default function ChatMessage({ setAvatarExpressionFuncRef }) {
  const [chatProcessing, setChatProcessing] = React.useState(false);
  const [chatMessage, setChatMessage] = React.useState("");
  const [assistantMessage, setAssistantMessage] = React.useState("");
  const [chatLog, setChatLog] = React.useState([]);
  const messageInputRef = React.useRef();
  const isMessageInputFocusedRef = React.useRef(false);
  const [speechRecognition, setSpeechRecognition] = React.useState();
  const [isMicRecording, setIsMicRecording] = React.useState(false);

  const captureKeyDown = React.useCallback((event) => {
    console.log("event.key: ", event.key);
    // console.log("document.activeElement: ", document.activeElement);
    if (event.key === "Tab") {
      if (isMessageInputFocusedRef.current === false) {
        event.preventDefault();
        handleClickMicButton();
      }
    }

    if (event.key === "/") {
      if (isMessageInputFocusedRef.current === false) {
        event.preventDefault();
        messageInputRef.current.focus();
      }
    }
  }, []);

  const handleClickMicButton = React.useCallback(() => {
    console.log("call handleClickMicButton()");

    if (isMicRecording) {
      speechRecognition?.abort();
      setIsMicRecording(false);

      return;
    }

    speechRecognition?.start();
    setIsMicRecording(true);
  }, [isMicRecording, speechRecognition]);

  const handleSendChat = React.useCallback(
    async function (message) {
      console.log("call handleSendChat()");
      // console.log("openAiKey: ", openAiKey);
      console.log("message: ", message);

      const SYSTEM_PROMPT = `From now on, you will behave and talk as a person who is on good terms with the user.
There are five types of emotions: "neutral" indicating normal, "happy" indicating joy, "angry" indicating anger, "sad" indicating sadness, and "relaxed" indicating peace.

The format of the dialogue is as follows.
[{Neutral|Happy|Joy|Angry|Sad|Sorrow|Relaxed|Fun|Surprised}]{sentence}

An example of your statement is below.
[Neutral] Hello. [Happy] How have you been?
[Joy] Sun is so bright. Today is very good.
[Happy] Aren't these clothes cute?
[Happy] Recently, I'm obsessed with clothes from this shop!
[Sorrow] My dos is so weak.
[Sad] I forgot, sorry.
[Relaxed] Have your time. Slow down a little bit.
[Fun] Your word makes me happy. I can't stop laughing.
[Sad] Anything interesting lately?
[Surprised] What is this? I've never seen this one.
[Angry] Eh! [Angry] It's terrible to keep it a secret!
[Neutral] What are your plans for summer vacation? [Happy] Let's go to the beach!

Please reply with only one sentence that is most appropriate for your response.
Please refrain from using tones and honorifics.
Let's start the conversation.`;

      //* Check error.
      if (message == null) {
        //* TODO: Show error toast message.
        return;
      }

      //* Set chat processing status.
      setChatProcessing(true);

      //* Make a message log with message.
      const messageLog = [...chatLog, { role: "user", content: message }];
      setChatLog(messageLog);

      //* Add a system prompt.
      const messages = [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...messageLog,
      ];

      //* TODO: Handle in api with user authentication.
      const stream = await getChatResponseStream(messages).catch((error) => {
        console.error(error);
        setChatProcessing(false);
        return null;
      });
      // console.log("stream: ", stream);

      //* Check error.
      if (stream == null) {
        setChatProcessing(false);
        return;
      }

      const reader = stream.getReader();
      let receivedMessage = "";
      let aiTextLog = "";
      let tag = "";
      const sentences = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          // console.log("done: ", done);
          // console.log("value: ", value);
          if (done) break;

          receivedMessage += value;

          //* Detecting tags in reply content.
          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          // console.log("tagMatch: ", tagMatch);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);
          }
          // console.log("tag: ", tag);
          // console.log("receivedMessage: ", receivedMessage);
          setAssistantMessage([...sentences, receivedMessage].join(" "));

          //* Cut out and process responses in units of sentences.
          const sentenceMatch = receivedMessage.match(
            /^(.+[。．.!?\n]|.{10,}[、,])/
          );
          // console.log("sentenceMatch: ", sentenceMatch);

          if (sentenceMatch && sentenceMatch[0]) {
            const sentence = sentenceMatch[0];
            // console.log("sentence: ", sentence);

            sentences.push(sentence);
            receivedMessage = receivedMessage
              .slice(sentence.length)
              .trimStart();

            //* Skip if it is a character string that does not need to be spoken/impossible.
            if (
              !sentence.replace(
                /^[\s\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]]+$/g,
                ""
              )
            ) {
              // console.log("continue");
              continue;
            }

            const aiText = `${tag} ${sentence}`;
            aiTextLog += aiText;
            // console.log("aiTextLog: ", aiTextLog);

            //* Generate & play audio for each sentence.
            let utterance = new SpeechSynthesisUtterance(sentence);
            utterance.rate = 0.9;
            // console.log("utterance: ", utterance);

            const expressionMatch = tag.match(/^\[(.*?)\]$/);
            let expression = "Neutral";
            // console.log("expressionMatch: ", expressionMatch);
            if (expressionMatch && expressionMatch.length >= 2) {
              expression = expressionMatch[1];
            }

            // console.log("expression: ", expression);
            setAvatarExpressionFuncRef.current({ expression: expression });
            //* After utterance speaking finished, make an expression neutral.
            utterance.onend = (event) => {
              console.log(
                `Utterance has finished being spoken after ${event.elapsedTime} seconds.`
              );
              sleep(3000).then(() =>
                setAvatarExpressionFuncRef.current({ expression: "Neutral" })
              );
            };
            window.speechSynthesis.speak(utterance);
          }
        }
      } catch (e) {
        setChatProcessing(false);
        console.error(e);
      } finally {
        reader.releaseLock();
        //* TODO: How can we focus on input?
        messageInputRef.current.focus();
      }

      //* Add assistant response to chat message log.
      const messageLogAssistant = [
        ...messageLog,
        { role: "assistant", content: aiTextLog },
      ];

      setChatLog(messageLogAssistant);
      setChatProcessing(false);
      setChatMessage("");
    },
    [chatLog, setAvatarExpressionFuncRef]
  );

  const handleRecognitionResult = React.useCallback(
    (event) => {
      const text = event.results[0][0].transcript;
      setChatMessage(text);

      if (event.results[0].isFinal) {
        setChatMessage(text);
        handleSendChat(text);
      }
    },
    [handleSendChat]
  );

  const handleRecognitionEnd = React.useCallback(() => {
    setIsMicRecording(false);
  }, []);

  React.useEffect(() => {
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.addEventListener("result", handleRecognitionResult);
    recognition.addEventListener("end", handleRecognitionEnd);

    setSpeechRecognition(recognition);
  }, [handleRecognitionResult, handleRecognitionEnd]);

  React.useEffect(
    function () {
      document.addEventListener("keydown", captureKeyDown, false);

      return () => {
        document.removeEventListener("keydown", captureKeyDown, false);
      };
    },
    [captureKeyDown]
  );

  async function getChatResponseStream(messages) {
    const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_KEY;

    //* Set api key and send message to openai API.
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    };
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: headers,
      method: "POST",
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        stream: true,
        max_tokens: 200,
      }),
    });

    const reader = res.body?.getReader();

    //* Check response error.
    if (res.status !== 200 || !reader) {
      throw new Error("Something went wrong");
    }

    //* Handle stream response.
    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder("utf-8");
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const data = decoder.decode(value);
            const chunks = data
              .split("data:")
              .filter((val) => !!val && val.trim() !== "[DONE]");

            for (const chunk of chunks) {
              const json = JSON.parse(chunk);
              const messagePiece = json.choices[0].delta.content;
              if (!!messagePiece) {
                controller.enqueue(messagePiece);
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return stream;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  return (
    <Box sx={{ zIndex: Z_INDEX.chatMessage, position: "absolute" }}>
      <Box position="fixed" bottom={0}>
        <Paper
          component="form"
          sx={{
            m: "20px",
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            width: "95vw",
          }}
        >
          <IconButton sx={{ p: "10px" }} aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography sx={{ p: "10px", flex: 1 }}>
            {assistantMessage}
          </Typography>
          <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
          <IconButton type="button" sx={{ p: "10px" }} aria-label="search">
            <SearchIcon />
          </IconButton>
        </Paper>
        <Paper
          component="form"
          sx={{
            m: "20px",
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            width: "95vw",
          }}
        >
          <IconButton sx={{ p: "10px" }} onClick={handleClickMicButton}>
            <MicIcon />
          </IconButton>
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            inputRef={messageInputRef}
            placeholder="Write your message"
            disabled={chatProcessing}
            onFocus={() => {
              // console.log("call onFocus()");
              isMessageInputFocusedRef.current = true;
            }}
            onBlur={() => {
              // console.log("call onBlur()");
              isMessageInputFocusedRef.current = false;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSendChat(chatMessage);
              }
            }}
            value={chatMessage}
            onChange={(event) => {
              setChatMessage(event.target.value);
            }}
          />
          <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
          <IconButton
            color="primary"
            sx={{ p: "10px" }}
            aria-label="directions"
            onClick={() => {
              handleSendChat(chatMessage);
            }}
          >
            <SendIcon disabled={chatProcessing} />
          </IconButton>
        </Paper>
      </Box>
    </Box>
  );
}
