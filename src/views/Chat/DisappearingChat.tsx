import { useEffect, useRef } from 'react';

import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';

import { store } from '../../store/store';
import { ChannelChatMessageEvent } from '../../types/twitchEvents';
import { isMessageVisible } from '../../utils/messageVisibility';
import { ChatEntry } from './ChatEntry';
import { chatEntryStyleProps, useChatSearchParams } from './useChatSearchParams';

type MessageProps = {
  chatMessage: ChannelChatMessageEvent;
};

const Message = ({ chatMessage }: MessageProps) => {
  const chatSearchParams = useChatSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      store.getState().removeChatMessage(chatMessage);
    }, chatSearchParams.secondsBeforeExit * 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [chatSearchParams.secondsBeforeExit, chatMessage]);

  const ChatEntryProps = {
    chatMessage,
    ...chatEntryStyleProps(chatSearchParams),
    userInformationStore: store.getState().userInformation,
  };

  if (chatSearchParams.animatedEntry) {
    return (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="message">
        <ChatEntry {...ChatEntryProps} />
      </motion.div>
    );
  } else {
    return <ChatEntry {...ChatEntryProps} />;
  }
};

export const DisappearingChat = () => {
  const chatMessageEvents = store((s) => s.chatMessageEvents);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const chatSearchParams = useChatSearchParams();

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessageEvents]);

  const filteredMessages = chatMessageEvents.filter((m) => isMessageVisible(m, chatSearchParams));

  return (
    <div className={classNames('chat-disappearing', chatSearchParams.chatAnchor === 'top' && 'chat-disappearing--top')}>
      <AnimatePresence>
        {filteredMessages.map((chatMessage) => (
          <Message key={chatMessage.message_id} chatMessage={chatMessage} />
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
};
