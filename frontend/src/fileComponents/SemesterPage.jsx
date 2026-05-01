
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Calendar } from "lucide-react";

const SemesterPage = ({ semester, onBack, onFileSelect }) => {

  const semesterData = {
    1: {
      title: "MCA 1st Semester",
      subjects: [
        {
          name: "Data Structures",
          papers: [
            {
              title: "Data Structures - 2023",
              year: "2023",
              type: "pdf",
              url: "/placeholder.svg?height=800&width=600",
            },
            {
              title: "Data Structures - 2022",
              year: "2022",
              type: "pdf",
              url: "/placeholder.svg?height=800&width=600",
            },
            {
              title: "Data Structures - 2021",
              year: "2021",
              type: "image",
              url: "/placeholder.svg?height=800&width=600",
            },
          ],
        },
        {
          name: "Programming in C",
          papers: [
            {
              title: "Programming in C - 2023",
              year: "2023",
              type: "pdf",
              url: "/placeholder.svg?height=800&width=600",
            },
            {
              title: "Programming in C - 2022",
              year: "2022",
              type: "image",
              url: "/placeholder.svg?height=800&width=600",
            },
          ],
        },
        {
          name: "Computer Organization",
          papers: [
            {
              title: "Computer Organization - 2023",
              year: "2023",
              type: "pdf",
              url: "/placeholder.svg?height=800&width=600",
            },
            {
              title: "Computer Organization - 2022",
              year: "2022",
              type: "pdf",
              url: "/placeholder.svg?height=800&width=600",
            },
          ],
        },
      ],
    },
    2: {
      title: "MCA 2nd Semester",
      subjects: [
        {
          name: "Operating Systems",
          papers: [
            {
              title: "Operating Systems - 2023",
              year: "2023",
              type: "pdf",
              url: "/placeholder.svg?height=800&width=600",
            },
            {
              title: "Operating Systems - 2022",
              year: "2022",
              type: "image",
              url: "/placeholder.svg?height=800&width=600",
            },
          ],
        },
        {
          name: "Database Management",
          papers: [
            {
              title: "Database Management - 2023",
              year: "2023",
              type: "pdf",
              url: "/placeholder.svg?height=800&width=600",
            },
            {
              title: "Database Management - 2022",
              year: "2022",
              type: "pdf",
              url: "/placeholder.svg?height=800&width=600",
            },
          ],
        },
      ],
    },
    3: {
      title: "MCA 3rd Semester",
      subjects: [
        {
          name: "Software Engineering",
          papers: [
            {
              title: "Software Engineering - 2023",
              year: "2023",
              type: "pdf",
              url: "/placeholder.svg?height=800&width=600",
            },
            {
              title: "Software Engineering - 2022",
              year: "2022",
              type: "image",
              url: "/placeholder.svg?height=800&width=600",
            },
          ],
        },
        {
          name: "Web Technologies",
          papers: [
            {
              title: "Web Technologies - 2023",
              year: "2023",
              type: "pdf",
              url: "/placeholder.svg?height=800&width=600",
            },
            {
              title: "Web Technologies - 2022",
              year: "2022",
              type: "pdf",
              url: "/placeholder.svg?height=800&width=600",
            },
          ],
        },
      ],
    },
  };

  const currentSemester = semesterData[semester];

  const handlePaperClick = (paper, subject) => {
    onFileSelect({
      ...paper,
      subject,
      semester: currentSemester.title,
    });
  };

  if (!currentSemester) {
    return (
      <div className="min-h-screen w-full h-full bg-gradient-to-br from-gray-900 via-blue-900 to-black-900 flex items-center justify-center text-white">
        <p className="text-xl">Semester data not found.</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors ml-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full h-full bg-gradient-to-br from-gray-900 via-blue-900 to-black-900 flex flex-col p-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center mb-8 mt-8 px-8"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors mr-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </motion.button>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
          {currentSemester.title} Papers
        </h1>
      </motion.div>

      {/* Subjects and Papers */}
      <div className="space-y-8 w-full px-8 flex-1">
        {currentSemester.subjects.map((subject, subjectIndex) => (
          <motion.div
            key={subject.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * subjectIndex }}
            className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-700"
          >
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-2">
                {subject.name}
              </h2>
              <p className="text-gray-300">
                Previous year examination papers
              </p>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subject.papers.map((paper, paperIndex) => (
                  <motion.div
                    key={paperIndex}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePaperClick(paper, subject.name)}
                    className="bg-gray-700 bg-opacity-50 rounded-xl p-4 cursor-pointer border border-gray-600 hover:border-green-500 transition-all duration-300"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm mb-1 truncate">
                          {paper.title}
                        </h3>

                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{paper.year}</span>
                          <span className="text-gray-500">•</span>
                          <span className="uppercase">{paper.type}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SemesterPage;