const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/millerstorm";

async function fixQuizFlags() {
  try {
    await mongoose.connect(uri, { dbName: "millerstorm" });
    console.log("Connected to MongoDB\n");

    const courseId = "course-1772453467869";
    
    const course = await mongoose.connection.db.collection("courses").findOne({ id: courseId });
    
    if (!course) {
      console.log("Course not found!");
      return;
    }

    console.log("Fixing quiz flags...\n");
    
    const updatedPages = course.pages.map(page => {
      // If page has quizQuestions array with items, it should be a quiz
      if (page.quizQuestions && page.quizQuestions.length > 0) {
        console.log(`✓ Setting isQuiz=true for: ${page.title} (has ${page.quizQuestions.length} questions)`);
        return { ...page, isQuiz: true };
      }
      // If title suggests it's a quiz
      if (page.title && (page.title.toLowerCase().includes('quiz') || page.title.toLowerCase().includes('test'))) {
        console.log(`✓ Setting isQuiz=true for: ${page.title} (title suggests quiz)`);
        return { ...page, isQuiz: true };
      }
      return page;
    });

    await mongoose.connection.db.collection("courses").updateOne(
      { id: courseId },
      { $set: { pages: updatedPages } }
    );

    console.log("\n✅ Quiz flags fixed!");
    
    // Verify
    const updated = await mongoose.connection.db.collection("courses").findOne({ id: courseId });
    const quizPages = updated.pages.filter(p => p.isQuiz === true);
    console.log(`\nQuiz pages found: ${quizPages.length}`);
    quizPages.forEach(q => {
      console.log(`  - ${q.title} (${q.quizQuestions?.length || 0} questions)`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nConnection closed");
  }
}

fixQuizFlags();
