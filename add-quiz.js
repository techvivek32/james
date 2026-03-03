const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/millerstorm";

const quizQuestionSchema = new mongoose.Schema(
  {
    id: String,
    prompt: String,
    options: [String],
    correctIndex: Number
  },
  { _id: false }
);

const lessonLinkSchema = new mongoose.Schema(
  {
    label: String,
    href: String
  },
  { _id: false }
);

const coursePageSchema = new mongoose.Schema(
  {
    id: String,
    title: String,
    status: String,
    body: String,
    folderId: String,
    videoUrl: String,
    transcript: String,
    pinnedCommunityPostUrl: String,
    resourceLinks: [lessonLinkSchema],
    fileUrls: [String],
    isQuiz: Boolean,
    quizQuestions: [quizQuestionSchema]
  },
  { _id: false }
);

const courseFolderSchema = new mongoose.Schema(
  {
    id: String,
    title: String,
    status: String
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    tagline: String,
    description: String,
    lessonNames: [String],
    assetFiles: [String],
    marketingDocs: [String],
    icon: String,
    difficultyLabel: String,
    timeLabel: String,
    difficultyScore: Number,
    timeScore: Number,
    riskScore: Number,
    capitalScore: Number,
    personalityScore: Number,
    quizQuestions: [quizQuestionSchema],
    links: [lessonLinkSchema],
    status: String,
    coverImageUrl: String,
    accessMode: String,
    folders: [courseFolderSchema],
    pages: [coursePageSchema]
  },
  { timestamps: true, strict: true, minimize: false }
);

const CourseModel = mongoose.models.Course || mongoose.model("Course", courseSchema);

async function addQuizToCourse() {
  try {
    await mongoose.connect(uri, { dbName: "millerstorm" });
    console.log("Connected to MongoDB");

    const courseId = "course-1772453467869";
    
    const course = await CourseModel.findOne({ id: courseId });
    
    if (!course) {
      console.log("Course not found!");
      return;
    }

    console.log("Found course:", course.title);

    const quizPage = {
      id: `page-${Date.now()}`,
      title: "Sample Quiz",
      status: "published",
      body: "<p>Test your knowledge with this quiz!</p>",
      folderId: course.folders && course.folders.length > 0 ? course.folders[0].id : null,
      videoUrl: "",
      transcript: "",
      pinnedCommunityPostUrl: "",
      resourceLinks: [],
      fileUrls: [],
      isQuiz: true,
      quizQuestions: [
        {
          id: `q-${Date.now()}-1`,
          prompt: "What is the capital of France?",
          options: ["London", "Paris", "Berlin", "Madrid"],
          correctIndex: 1
        },
        {
          id: `q-${Date.now()}-2`,
          prompt: "Which programming language is this course about?",
          options: ["Python", "Java", "JavaScript", "C++"],
          correctIndex: 2
        },
        {
          id: `q-${Date.now()}-3`,
          prompt: "What does HTML stand for?",
          options: [
            "Hyper Text Markup Language",
            "High Tech Modern Language",
            "Home Tool Markup Language",
            "Hyperlinks and Text Markup Language"
          ],
          correctIndex: 0
        }
      ]
    };

    if (!course.pages) {
      course.pages = [];
    }
    
    course.pages.push(quizPage);

    await course.save();

    console.log("✅ Quiz added successfully!");
    console.log("Quiz ID:", quizPage.id);
    console.log("Quiz Title:", quizPage.title);
    console.log("Number of questions:", quizPage.quizQuestions.length);
    console.log("Total pages in course:", course.pages.length);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Connection closed");
  }
}

addQuizToCourse();
