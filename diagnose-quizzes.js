const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/millerstorm";

async function diagnoseQuizzes() {
  try {
    await mongoose.connect(uri, { dbName: "millerstorm" });
    console.log("Connected to MongoDB\n");

    const courseId = "course-1772453467869";
    
    const course = await mongoose.connection.db.collection("courses").findOne({ id: courseId });
    
    if (!course) {
      console.log("Course not found!");
      return;
    }

    console.log("=".repeat(60));
    console.log("COURSE DIAGNOSIS");
    console.log("=".repeat(60));
    console.log("Course ID:", course.id);
    console.log("Course Title:", course.title);
    console.log("Total Pages:", course.pages?.length || 0);
    console.log("\n");

    if (!course.pages || course.pages.length === 0) {
      console.log("No pages found in course");
      return;
    }

    console.log("=".repeat(60));
    console.log("ALL PAGES");
    console.log("=".repeat(60));
    
    course.pages.forEach((page, index) => {
      console.log(`\n[${index + 1}] ${page.title || 'Untitled'}`);
      console.log(`    ID: ${page.id}`);
      console.log(`    Status: ${page.status}`);
      console.log(`    Folder ID: ${page.folderId || 'None'}`);
      console.log(`    Is Quiz: ${page.isQuiz === true ? 'YES' : 'NO'}`);
      
      if (page.isQuiz) {
        const qCount = page.quizQuestions?.length || 0;
        console.log(`    Quiz Questions: ${qCount}`);
        
        if (qCount === 0) {
          console.log(`    ⚠️  WARNING: Quiz has no questions!`);
        } else {
          page.quizQuestions.forEach((q, qi) => {
            console.log(`\n      Q${qi + 1}: ${q.prompt || '(empty prompt)'}`);
            console.log(`          Options: ${q.options?.length || 0}`);
            q.options?.forEach((opt, oi) => {
              const marker = oi === q.correctIndex ? '✓' : ' ';
              console.log(`            [${marker}] ${opt || '(empty)'}`);
            });
          });
        }
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    const quizPages = course.pages.filter(p => p.isQuiz === true);
    const regularPages = course.pages.filter(p => !p.isQuiz);
    console.log(`Total Pages: ${course.pages.length}`);
    console.log(`Regular Pages: ${regularPages.length}`);
    console.log(`Quiz Pages: ${quizPages.length}`);
    
    const emptyQuizzes = quizPages.filter(p => !p.quizQuestions || p.quizQuestions.length === 0);
    if (emptyQuizzes.length > 0) {
      console.log(`\n⚠️  ${emptyQuizzes.length} quiz(zes) have NO questions:`);
      emptyQuizzes.forEach(q => console.log(`   - ${q.title} (${q.id})`));
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nConnection closed");
  }
}

diagnoseQuizzes();
