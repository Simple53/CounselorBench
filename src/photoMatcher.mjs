export function matchPhotoToStudent(filename, students) {
  const clean = filename.replace(/\.[^.]+$/, "").trim();

  // 1. 尝试匹配包含的学号（连续 8-12 位数字）
  const numMatch = /(\d{8,12})/.exec(clean);
  if (numMatch) {
    const studentByNum = students.find((s) => s.number === numMatch[1]);
    if (studentByNum) return { student: studentByNum, matchType: "number" };
  }

  // 2. 尝试全词完全匹配学号
  const directNum = students.find((s) => s.number === clean);
  if (directNum) return { student: directNum, matchType: "number" };

  // 3. 尝试匹配姓名（汉字或拼音）
  for (const s of students) {
    if (s.name && (clean === s.name || clean.includes(s.name))) {
      return { student: s, matchType: "name" };
    }
  }

  return null;
}

export function batchMatchPhotos(files, students) {
  const matched = [];
  const unmatched = [];

  for (const file of files) {
    const result = matchPhotoToStudent(file.name, students);
    if (result) {
      matched.push({
        file,
        student: result.student,
        matchType: result.matchType,
      });
    } else {
      unmatched.push({
        file,
        reason: "未能识别文件名中的学号或姓名",
      });
    }
  }

  return { matched, unmatched };
}
