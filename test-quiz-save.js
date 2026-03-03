const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/millerstorm";

async function testQuizSave() {
  try {
    await mongoose.connect(uri, { dbName: "millerstorm" });
    console.log("Connected to MongoDB\n");

    const courseId = "course-1772453467869";
    
    // Simulate what the UI does
    const course = await mongoose.connection.db.collection("courses").findOne({ id: courseId });
    
    if (!course) {
      console.log("Course not found!");
      return;
    }

    console.log("Current course pages:", course.pages?.length || 0);
    
    // Add a new quiz page like the UI would
    const newQuizPage = {
      id: `page-${Date.now()}`,
      title: "UI Test Quiz",
      status: "published",
      body: "",
      folderId: course.folders && course.folders.length > 0 ? course.folders[0].id : null,
      videoUrl: "",
      transcript: "",
      pinnedCommunityPostUrl: "",
      resourceLinks: [],
      fileUrls: [],
      isQuiz: true,
      quizQuestions: [
        {
          id: `q-${Date.now()}`,
          prompt: "Test question from UI simulation?",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctIndex: 1
        }
      ]
    };

    const updatedPages = [...(course.pages || []), newQuizPage];
    
    // Update using the same method as the API
    const result = await mongoose.connection.db.collection("courses").findOneAndUpdate(
      { id: courseId },
      { $set: { pages: updatedPages } },
      { returnDocument: 'after' }
    );

    console.log("\n✅ Quiz page added via simulation");
    console.log("New page ID:", newQuizPage.id);
    console.log("Total pages after update:", result.pages?.length || 0);
    
    // Verify it was saved
    const verification = await mongoose.connection.db.collection("courses").findOne({ id: courseId });
    const savedQuiz = verification.pages?.find(p => p.id === newQuizPage.id);
    
    if (savedQuiz) {
      console.log("\n✅ Verification: Quiz found in database");
      console.log("Quiz title:", savedQuiz.title);
      console.log("Is quiz:", savedQuiz.isQuiz);
      console.log("Questions count:", savedQuiz.quizQuestions?.length || 0);
      if (savedQuiz.quizQuestions && savedQuiz.quizQuestions.length > 0) {
        console.log("First question:", savedQuiz.quizQuestions[0].prompt);
      }
    } else {
      console.log("\n❌ ERROR: Quiz not found after save!");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nConnection closed");
  }
}

testQuizSave();
