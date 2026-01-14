export type Feedback<IdType = string> = {
  threadId: IdType;
  isMemberFeedback: boolean;
  authorId: IdType;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FeedbackWithId<IdType = string> = Feedback<IdType> & {
  _id: IdType;
};

export type FeedbackWithAuthorAndId<IdType = string> =
  FeedbackWithId<IdType> & {
    author: {
      name: string;
      image: string;
    };
  };
