import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer"
import type { Resume } from "./resume"

const colors = {
  ink: "#111111",
  body: "#333333",
  muted: "#555555",
  rule: "#d4d4d4",
  link: "#0759c7",
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 49,
    paddingRight: 68,
    paddingBottom: 46,
    paddingLeft: 68,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.38,
    color: colors.ink,
  },
  header: {
    marginBottom: 22,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  identity: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 24,
  },
  name: {
    fontSize: 21,
    lineHeight: 1.08,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  headline: {
    fontSize: 10,
    lineHeight: 1.25,
    marginBottom: 3,
  },
  identityMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    fontSize: 9.25,
    lineHeight: 1.35,
  },
  metaItem: {
    marginRight: 7,
  },
  metaSeparator: {
    marginRight: 7,
    color: colors.ink,
  },
  link: {
    color: colors.link,
    textDecoration: "underline",
  },
  contact: {
    width: 126,
    alignItems: "flex-end",
    paddingTop: 5,
  },
  email: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    lineHeight: 1.3,
    color: colors.ink,
    textDecoration: "none",
    marginBottom: 4,
  },
  phone: {
    fontSize: 9.5,
    lineHeight: 1.3,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 10.5,
    lineHeight: 1.2,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.38,
    color: colors.body,
  },
  experienceList: {
    marginTop: 1,
  },
  experience: {
    flexDirection: "row",
  },
  timeline: {
    width: 14,
    marginLeft: 5,
    marginRight: 6,
    borderLeftWidth: 0.75,
    borderLeftColor: colors.rule,
    position: "relative",
  },
  timelineMarker: {
    position: "absolute",
    top: 3,
    left: -3.5,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 0.75,
    borderColor: "#bdbdbd",
    backgroundColor: "#f8f8f8",
  },
  experienceContent: {
    flexGrow: 1,
    flexShrink: 1,
    paddingBottom: 15,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  roleLine: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 12,
    fontSize: 10,
    lineHeight: 1.3,
  },
  role: {
    fontFamily: "Helvetica-Bold",
  },
  date: {
    width: 90,
    fontSize: 9.25,
    lineHeight: 1.35,
    textAlign: "right",
    color: colors.ink,
  },
  description: {
    fontSize: 9.75,
    lineHeight: 1.38,
    color: colors.body,
    marginBottom: 7,
  },
  bulletRow: {
    flexDirection: "row",
    paddingLeft: 1,
    marginBottom: 3,
  },
  bulletMark: {
    width: 14,
    fontSize: 9.5,
    lineHeight: 1.36,
    color: colors.body,
  },
  bulletText: {
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 9.5,
    lineHeight: 1.36,
    color: colors.body,
  },
  tech: {
    fontSize: 8.75,
    lineHeight: 1.35,
    color: colors.muted,
    marginTop: 3,
  },
  techLabel: {
    fontFamily: "Helvetica-Bold",
    color: colors.body,
  },
  simpleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 9,
  },
  simpleRowContent: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 12,
  },
  itemTitle: {
    fontSize: 10,
    lineHeight: 1.35,
    fontFamily: "Helvetica-Bold",
  },
  itemMeta: {
    fontSize: 9.5,
    lineHeight: 1.35,
    color: colors.body,
  },
  compactList: {
    marginTop: -1,
  },
})

interface PdfTemplateProps {
  resume: Resume
}

function displayUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, "")
    const path = parsed.pathname.replace(/\/$/, "")
    return `${host}${path}`
  } catch {
    return url
  }
}

function formatCompany(company: string, location: string): string {
  return location ? `${company} (${location})` : company
}

export function ResumePdfTemplate({ resume }: PdfTemplateProps) {
  return (
    <Document title={`${resume.fullName} - Resume`} author={resume.fullName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.identity}>
              <Text style={styles.name}>{resume.fullName}</Text>
              <Text style={styles.headline}>{resume.headline}</Text>
            </View>
            <View style={styles.contact}>
              <Link style={styles.email} href={`mailto:${resume.email}`}>
                {resume.email}
              </Link>
              {resume.phone && <Text style={styles.phone}>{resume.phone}</Text>}
            </View>
          </View>
          <View style={styles.identityMeta}>
            <Text style={styles.metaItem}>{resume.location}</Text>
            {resume.socials.map((social) => (
              <View key={social.url} style={{ flexDirection: "row" }}>
                <Text style={styles.metaSeparator}>•</Text>
                <Link style={[styles.link, styles.metaItem]} href={social.url}>
                  {displayUrl(social.url)}
                </Link>
              </View>
            ))}
          </View>
        </View>

        {resume.profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} minPresenceAhead={26}>
              Profile
            </Text>
            <Text style={styles.body}>{resume.profile}</Text>
          </View>
        )}

        {resume.workExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} minPresenceAhead={48}>
              Experience
            </Text>
            <View style={styles.experienceList}>
              {resume.workExperience.map((experience, index) => (
                <View
                  key={`${experience.company}-${index}`}
                  style={styles.experience}
                  wrap={false}
                >
                  <View style={styles.timeline}>
                    <View style={styles.timelineMarker} />
                  </View>
                  <View style={styles.experienceContent}>
                    <View style={styles.experienceHeader} minPresenceAhead={28}>
                      <Text style={styles.roleLine}>
                        <Text style={styles.role}>
                          {experience.positionTitle}
                        </Text>
                        {`  •  ${formatCompany(experience.company, experience.location)}`}
                      </Text>
                      <Text style={styles.date}>
                        {experience.from} - {experience.to ?? "Present"}
                      </Text>
                    </View>
                    {experience.description && (
                      <Text style={styles.description}>
                        {experience.description}
                      </Text>
                    )}
                    {experience.keyAchievements.map(
                      (achievement, achievementIndex) => (
                        <View
                          key={achievementIndex}
                          style={styles.bulletRow}
                          wrap={false}
                        >
                          <Text style={styles.bulletMark}>-</Text>
                          <Text style={styles.bulletText}>{achievement}</Text>
                        </View>
                      )
                    )}
                    {(experience.techStack.length > 0 ||
                      experience.methodologies.length > 0) && (
                      <Text style={styles.tech}>
                        {experience.techStack.length > 0 && (
                          <>
                            <Text style={styles.techLabel}>Stack: </Text>
                            {experience.techStack.join(", ")}
                          </>
                        )}
                        {experience.techStack.length > 0 &&
                          experience.methodologies.length > 0 &&
                          "  •  "}
                        {experience.methodologies.length > 0 && (
                          <>
                            <Text style={styles.techLabel}>Methods: </Text>
                            {experience.methodologies.join(", ")}
                          </>
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {resume.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} minPresenceAhead={38}>
              Education
            </Text>
            {resume.education.map((education, index) => (
              <View
                key={`${education.university}-${index}`}
                style={styles.simpleRow}
              >
                <View style={styles.simpleRowContent}>
                  <Text style={styles.itemTitle}>{education.degree}</Text>
                  <Text style={styles.itemMeta}>{education.university}</Text>
                </View>
                <Text style={styles.date}>
                  {education.from} - {education.to ?? "Present"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {resume.otherAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} minPresenceAhead={34}>
              Other Achievements
            </Text>
            <View style={styles.compactList}>
              {resume.otherAchievements.map((achievement, index) => (
                <View key={index} style={styles.simpleRow}>
                  <Text style={styles.itemMeta}>{achievement.name}</Text>
                  {achievement.date && (
                    <Text style={styles.date}>{achievement.date}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {resume.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} minPresenceAhead={24}>
              Languages
            </Text>
            <Text style={styles.body}>
              {resume.languages
                .map((language) => `${language.name} (${language.level})`)
                .join("  •  ")}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
