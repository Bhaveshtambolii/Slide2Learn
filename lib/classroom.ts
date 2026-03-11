// lib/classroom.ts
import { google } from 'googleapis'

/** Build a Google API client from a user's provider token (from Supabase session) */
export function getGoogleClients(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  const classroom = google.classroom({ version: 'v1', auth })
  const drive = google.drive({ version: 'v3', auth })
  return { classroom, drive }
}

/** Fetch all courses the user is enrolled in / teaching */
export async function fetchCourses(accessToken: string) {
  const { classroom } = getGoogleClients(accessToken)
  const res = await classroom.courses.list({ courseStates: ['ACTIVE'], pageSize: 30 })
  return res.data.courses || []
}

/** Fetch new announcements for a course */
export async function fetchAnnouncements(accessToken: string, courseId: string) {
  const { classroom } = getGoogleClients(accessToken)
  const res = await classroom.courses.announcements.list({
    courseId,
    orderBy: 'updateTime desc',
    pageSize: 20,
  })
  return (res.data.announcements || []).map(ann => ({
    id: `announcement_${ann.id}`,
    type: 'Announcement' as const,
    title: (ann.text || 'Untitled Announcement').slice(0, 100),
    createdTime: ann.creationTime,
    materials: ann.materials || [],
  }))
}

/** Fetch coursework (assignments) for a course */
export async function fetchCourseWork(accessToken: string, courseId: string) {
  const { classroom } = getGoogleClients(accessToken)
  const res = await classroom.courses.courseWork.list({
    courseId,
    orderBy: 'updateTime desc',
    pageSize: 20,
  })
  return (res.data.courseWork || []).map(work => ({
    id: `coursework_${work.id}`,
    type: 'Assignment' as const,
    title: work.title || 'Untitled Assignment',
    createdTime: work.creationTime,
    materials: work.materials || [],
  }))
}

/** Fetch course materials */
export async function fetchCourseMaterials(accessToken: string, courseId: string) {
  const { classroom } = getGoogleClients(accessToken)
  try {
    const res = await classroom.courses.courseWorkMaterials.list({
      courseId,
      orderBy: 'updateTime desc',
      pageSize: 20,
    })
    return (res.data.courseWorkMaterial || []).map(mat => ({
      id: `material_${mat.id}`,
      type: 'Material' as const,
      title: mat.title || 'Untitled Material',
      createdTime: mat.creationTime,
      materials: mat.materials || [],
    }))
  } catch {
    return []
  }
}

/** Extract a list of usable attachments from a materials array */
export function extractAttachments(materials: any[]) {
  return materials
    .map(m => {
      if (m.driveFile?.driveFile) {
        const f = m.driveFile.driveFile
        return { type: 'drive' as const, name: f.title || 'file', id: f.id, url: f.alternateLink }
      }
      if (m.youtubeVideo) {
        const v = m.youtubeVideo
        return { type: 'youtube' as const, name: v.title || 'YouTube', url: `https://www.youtube.com/watch?v=${v.id}` }
      }
      if (m.link) {
        return { type: 'url' as const, name: m.link.title || m.link.url, url: m.link.url }
      }
      return null
    })
    .filter(Boolean) as Array<{ type: 'drive' | 'youtube' | 'url'; name: string; id?: string; url?: string }>
}
