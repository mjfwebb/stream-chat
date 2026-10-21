import { memo, useRef } from 'react';

import { motion } from 'framer-motion';
import type { VirtuosoHandle } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

import { store } from '../../store/store';
import { ChatEntry } from './ChatEntry';
import { chatEntryStyleProps, useChatSearchParams } from './useChatSearchParams';

export const NonDisappearingChat = () => {
  const chatSearchParams = useChatSearchParams();

  const chatMessages = store((s) => s.chatMessageEvents);
  const virtuoso = useRef<VirtuosoHandle>(null);

  const filteredMessages = chatMessages.filter((m) => {
    if (!chatSearchParams.usernameFilterRegex && !chatSearchParams.messageFilterRegex) {
      return true;
    }

    const userOk = chatSearchParams.usernameFilterRegex ? chatSearchParams.usernameFilterRegex.test(m.chatter_user_name) : true;
    const msgOk = chatSearchParams.messageFilterRegex ? chatSearchParams.messageFilterRegex.test(m.message.text) : true;

    return userOk && msgOk;
  });

  const InnerItem = memo(({ index }: { index: number }) => {
    return (
      <ChatEntry
        chatMessage={filteredMessages[index]}
        {...chatEntryStyleProps(chatSearchParams)}
        userInformationStore={store.getState().userInformation}
      />
    );
  });

  const itemContent = (index: number) => {
    if (chatSearchParams.animatedEntry) {
      return (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="message">
          <InnerItem index={index} />
        </motion.div>
      );
    } else {
      return <InnerItem index={index} />;
    }
  };

  return (
    <Virtuoso
      ref={virtuoso}
      alignToBottom={chatSearchParams.chatAnchor === 'bottom'}
      followOutput={'auto'}
      itemContent={itemContent}
      totalCount={filteredMessages.length}
      initialTopMostItemIndex={filteredMessages.length - 1}
      atBottomThreshold={400}
    />
  );
};
