import { google } from 'googleapis'

export function getClassroomClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.classroom({ version: 'v1', auth })
}

// ── Courses ─────────────────────────────────────────────────
export async function fetchCourses(token: string) {
  const cl = getClassroomClient(token)
  const res = await cl.courses.list({ pageSize: 50 })
  return res.data.courses || []
}

// ── Students ─────────────────────────────────────────────────
export async function fetchStudents(token: string, courseId: string) {
  const cl = getClassroomClient(token)
  const res = await cl.courses.students.list({ courseId, pageSize: 100 })
  return res.data.students || []
}

// ── Teachers ─────────────────────────────────────────────────
export async function fetchTeachers(token: string, courseId: string) {
  const cl = getClassroomClient(token)
  const res = await cl.courses.teachers.list({ courseId, pageSize: 50 })
  return res.data.teachers || []
}

// ── Topics ───────────────────────────────────────────────────
export async function fetchTopics(token: string, courseId: string) {
  const cl = getClassroomClient(token)
  const res = await cl.courses.topics.list({ courseId, pageSize: 100 })
  return res.data.topic || []
}

// ── Announcements ────────────────────────────────────────────
export async function fetchAnnouncements(token: string, courseId: string) {
  const cl = getClassroomClient(token)
  const res = await cl.courses.announcements.list({ courseId, pageSize: 50 })
  return res.data.announcements || []
}

// ── CourseWork (assignments + questions) ────────────────────
export async function fetchCourseWork(token: string, courseId: string) {
  const cl = getClassroomClient(token)
  const res = await cl.courses.courseWork.list({ courseId, pageSize: 50 })
  return res.data.courseWork || []
}

// ── Course Work Materials ────────────────────────────────────
export async function fetchCourseMaterials(token: string, courseId: string) {
  const cl = getClassroomClient(token)
  const res = await cl.courses.courseWorkMaterials.list({ courseId, pageSize: 50 })
  return res.data.courseWorkMaterial || []
}

// ── Student Submissions for a piece of CourseWork ────────────
export async function fetchSubmissions(token: string, courseId: string, courseWorkId: string) {
  const cl = getClassroomClient(token)
  const res = await cl.courses.courseWork.studentSubmissions.list({ courseId, courseWorkId })
  return res.data.studentSubmissions || []
}

// ── Extract all Drive/YouTube/link attachments ───────────────
export function extractAttachments(materials: any[] = []) {
  return materials.flatMap((m: any) => {
    if (m.driveFile)    return [{ type: 'drive',   id: m.driveFile.driveFile?.id,    title: m.driveFile.driveFile?.title,    url: m.driveFile.driveFile?.alternateLink }]
    if (m.youtubeVideo) return [{ type: 'youtube', id: m.youtubeVideo.id,            title: m.youtubeVideo.title,            url: `https://youtu.be/${m.youtubeVideo.id}` }]
    if (m.link)         return [{ type: 'link',    id: null,                          title: m.link.title || m.link.url,     url: m.link.url }]
    if (m.form)         return [{ type: 'form',    id: m.form.formUrl,                title: m.form.title,                   url: m.form.formUrl }]
    return []
  })
}
