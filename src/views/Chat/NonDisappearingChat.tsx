import { memo, useRef } from 'react';

import { motion } from 'motion/react';
import type { VirtuosoHandle } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

import { store } from '../../store/store';
import { isMessageVisible } from '../../utils/messageVisibility';
import { ChatEntry } from './ChatEntry';
import { chatEntryStyleProps, useChatSearchParams } from './useChatSearchParams';

export const NonDisappearingChat = () => {
  const chatSearchParams = useChatSearchParams();

  const chatMessages = store((s) => s.chatMessageEvents);
  const virtuoso = useRef<VirtuosoHandle>(null);

  const filteredMessages = chatMessages.filter((m) => isMessageVisible(m, chatSearchParams));

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
