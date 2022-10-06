import { useRouter } from 'next/router'
import React from 'react'
import Layout from '../../../../components/Layout'
import withQueryLoader, {
  QueryDataProps
} from '../../../../containers/withQueryLoader'
import { GetExercisesQuery, useGetSessionQuery } from '../../../../graphql'
import Error, { StatusCode } from '../../../../components/Error'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import AlertsDisplay from '../../../../components/AlertsDisplay'
import ExercisePreviewCard from '../../../../..../../components/ExercisePreviewCard'
import { NewButton } from '../../../../..../../components/theme/Button'
import GET_EXERCISES from '../../../../..../../graphql/queries/getExercises'
import styles from '../../../../scss/exercises.module.scss'
import LessonTabs from '../../../../components/LessonTabs'
import { LessonTab } from '../../../../components/LessonTabs/LessonTabs'

type ExerciseLesson = {
  title: string
  docUrl?: string | null
  slug: string
}

const MentorPage: React.FC<QueryDataProps<GetExercisesQuery>> = ({
  queryData
}) => {
  const { data } = useGetSessionQuery()
  const sessionUser = data?.session.user

  const { lessons, alerts, exercises } = queryData
  const router = useRouter()

  if (!router.isReady) return <LoadingSpinner />

  const slug = router.query.lessonSlug
  if (!lessons || !alerts || !exercises)
    return <Error code={StatusCode.INTERNAL_SERVER_ERROR} message="Bad data" />

  const currentLesson = lessons.find(lesson => lesson.slug === slug)
  if (!currentLesson)
    return <Error code={StatusCode.NOT_FOUND} message="Lesson not found" />

  const tabs = [
    ...(currentLesson.docUrl
      ? [{ text: 'lesson', url: currentLesson.docUrl }]
      : []),
    { text: 'challenges', url: `/curriculum/${currentLesson.slug}` },
    { text: 'exercises', url: `/exercises/${currentLesson.slug}` },
    {
      text: 'mentor exercises',
      url: `/curriculum/${currentLesson.slug}/mentor`
    }
  ]

  const currentExercises = exercises
    .filter(
      exercise =>
        exercise.module.lesson.slug === slug &&
        exercise.author.id === sessionUser?.id
    )
    .map(exercise => ({
      id: exercise.id,
      moduleName: exercise.module.name,
      problem: exercise.description,
      answer: exercise.answer,
      explanation: exercise.explanation || ''
    }))

  return (
    <Layout title={currentLesson.title}>
      <ExerciseList
        tabs={tabs}
        lessonTitle={currentLesson.title}
        exercises={currentExercises}
        lesson={currentLesson}
      />

      {alerts && <AlertsDisplay alerts={alerts} />}
    </Layout>
  )
}

type ExerciseListProps = {
  tabs: { text: string; url: string }[]
  lessonTitle: string
  exercises: {
    moduleName: string
    problem: string
    answer: string
  }[]
  lesson: ExerciseLesson
}

const ExerciseList = ({
  lessonTitle,
  exercises,
  lesson
}: ExerciseListProps) => {
  const router = useRouter()

  return (
    <>
      <div className="mb-4">
        <LessonTabs lesson={lesson} activeTab={LessonTab.MENTOR_EXERCISES} />
      </div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
        <h1 className="my-2 my-md-5 fs-2">{lessonTitle}</h1>
        <div
          className={`mb-3 mb-md-0 d-flex d-md-block ${styles.exerciseList__solveExercisesButtonContainer}`}
        >
          <NewButton
            className="flex-grow-1"
            onClick={() =>
              router.push(`/curriculum/${lesson.slug}/mentor/addExercise`)
            }
          >
            ADD EXERCISE
          </NewButton>
        </div>
      </div>
      <div className={styles.exerciseList__container}>
        {exercises.map((exercise, i) => (
          <ExercisePreviewCard
            key={i}
            moduleName={exercise.moduleName}
            problem={exercise.problem}
          />
        ))}
        <div />
        <div />
      </div>
    </>
  )
}

export default withQueryLoader<GetExercisesQuery>(
  {
    query: GET_EXERCISES
  },
  MentorPage
)
