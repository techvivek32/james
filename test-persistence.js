const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/millerstorm";

async function testQuizPersistence() {
  try {
    await mongoose.connect(uri, { dbName: "millerstorm" });
    console.log("Connected to MongoDB\n");

    const courseId = "course-1772453467869";
    
    // Add a test quiz with questions
    const course = await mongoose.connection.db.collection("courses").findOne({ id: courseId });
    
    const testQuiz = {
      id: `page-test-${Date.now()}`,
      title: "Persistence Test Quiz",
      status: "published",
      body: "<p>Testing quiz persistence</p>",
      folderId: course.folders?.[0]?.id || null,
      videoUrl: "",
      transcript: "",
      pinnedCommunityPostUrl: "",
      resourceLinks: [],
      fileUrls: [],
      isQuiz: true,
      quizQuestions: [
        {
          id: `q-${Date.now()}-1`,
          prompt: "Will this question persist after refresh?",
          options: ["Yes", "No", "Maybe", "I don't know"],
          correctIndex: 0
        },
        {
          id: `q-${Date.now()}-2`,
          prompt: "Is the fix working?",
          options: ["Definitely", "Probably", "Not sure", "No"],
          correctIndex: 0
        }
      ]
    };

    const updatedPages = [...(course.pages || []), testQuiz];
    
    await mongoose.connection.db.collection("courses").updateOne(
      { id: courseId },
      { $set: { pages: updatedPages } }
    );

    console.log("✅ Test quiz added");
    console.log("Quiz ID:", testQuiz.id);
    console.log("Questions:", testQuiz.quizQuestions.length);
    
    // Verify immediately
    const verification = await mongoose.connection.db.collection("courses").findOne({ id: courseId });
    const savedQuiz = verification.pages.find(p => p.id === testQuiz.id);
    
    console.log("\n📊 Verification:");
    console.log("  isQuiz:", savedQuiz.isQuiz);
    console.log("  quizQuestions count:", savedQuiz.quizQuestions?.length || 0);
    
    if (savedQuiz.isQuiz && savedQuiz.quizQuestions && savedQuiz.quizQuestions.length > 0) {
      console.log("\n✅ SUCCESS: Quiz data is properly saved!");
      console.log("\n🔄 Now refresh your browser and check if the quiz is still there.");
      console.log("   The fix in course-management.tsx should preserve the data.");
    } else {
      console.log("\n❌ FAILED: Quiz data was not saved properly");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nConnection closed");
  }
}

testQuizPersistence();
