const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/millerstorm";

async function checkQuiz() {
  try {
    await mongoose.connect(uri, { dbName: "millerstorm" });
    console.log("Connected to MongoDB\n");

    const courseId = "course-1772453467869";
    
    const course = await mongoose.connection.db.collection("courses").findOne({ id: courseId });
    
    if (!course) {
      console.log("Course not found!");
      return;
    }

    console.log("Course:", course.title);
    console.log("Total pages:", course.pages?.length || 0);
    console.log("\n--- Quiz Pages ---");
    
    const quizPages = course.pages?.filter(page => page.isQuiz === true) || [];
    
    if (quizPages.length === 0) {
      console.log("No quiz pages found!");
    } else {
      quizPages.forEach((quiz, index) => {
        console.log(`\nQuiz ${index + 1}:`);
        console.log("  ID:", quiz.id);
        console.log("  Title:", quiz.title);
        console.log("  Status:", quiz.status);
        console.log("  Folder ID:", quiz.folderId || "None");
        console.log("  Questions:", quiz.quizQuestions?.length || 0);
        
        if (quiz.quizQuestions && quiz.quizQuestions.length > 0) {
          console.log("\n  Questions:");
          quiz.quizQuestions.forEach((q, i) => {
            console.log(`    ${i + 1}. ${q.prompt}`);
            console.log(`       Options: ${q.options.join(", ")}`);
            console.log(`       Correct: ${q.options[q.correctIndex]}`);
          });
        }
      });
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nConnection closed");
  }
}

checkQuiz();
